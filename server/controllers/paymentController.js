const stripeLib = require("stripe");

const Course = require("../models/Course");
const Payment = require("../models/Payment");

let stripe = null;
function getStripe() {
  if (stripe) return stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

function toPaise(inr) {
  // Treat input as INR (e.g. 499). Stripe expects paise.
  return Math.round(Number(inr) * 100);
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const course = await Course.findOne({ _id: courseId, isDeleted: false }).populate(
      "faculty",
      "name email"
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    const alreadyEnrolled = course.students?.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // If course is free, enrollment should not require Stripe.
    const priceInr = Number(course.price || 0);
    if (priceInr <= 0) {
      course.students.push(userId);
      await course.save();
      return res.json({ message: "Enrolled (free course)", course });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe not configured on server" });
    }

    // Create a payment record so the webhook can enroll the user idempotently.
    const payment = await Payment.create({
      user: userId,
      course: course._id,
      amountInr: priceInr,
      currency: "inr",
      stripeCheckoutSessionId: `pending_${Date.now()}_${userId}`,
      status: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

    const amountPaise = toPaise(priceInr);

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: amountPaise,
            product_data: {
              name: course.title,
            },
          },
        },
      ],
      metadata: {
        courseId: course._id.toString(),
        userId: userId.toString(),
        paymentId: payment._id.toString(),
      },
      success_url: `${frontendUrl}/student/courses?payment=success&courseId=${course._id.toString()}`,
      cancel_url: `${frontendUrl}/student/courses?payment=cancel&courseId=${course._id.toString()}`,
    });

    // Save actual Stripe session id for webhook lookup.
    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(400).send("Missing STRIPE_WEBHOOK_SECRET");

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).send("Missing STRIPE_SECRET_KEY");
    }

    const sig = req.headers["stripe-signature"];
    const event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const stripeCheckoutSessionId = session.id;

      const payment = await Payment.findOne({ stripeCheckoutSessionId });
      if (!payment) {
        // Nothing to do - respond 200 to avoid retry storms.
        return res.json({ received: true });
      }

      // Idempotency: only enroll once.
      if (payment.status !== "paid") {
        payment.status = "paid";
        await payment.save();

        const courseId = payment.course;
        const userId = payment.user;

        const course = await Course.findOne({ _id: courseId, isDeleted: false });
        if (course && !course.students?.some((id) => id.toString() === userId.toString())) {
          course.students.push(userId);
          await course.save();
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
};

