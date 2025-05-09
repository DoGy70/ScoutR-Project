import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;
    if (!name || !email || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        {
          status: 400,
        }
      );
    }

    let customer;
    const doesCustomerExist = await stripe.customers.list({
      email,
    });

    if (doesCustomerExist.data.length > 0) {
      customer = doesCustomerExist.data[0];
    } else {
      const newCustomer = await stripe.customers.create({
        name,
        email,
      });

      customer = newCustomer;
    }

    const ephermalKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2025-03-31.basil" }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: "bgn",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent,
        ephermalKey: ephermalKey,
        customer: customer.id,
      })
    );
  } catch (error) {
    console.error("Erorr createing: ", error);
  }
}
