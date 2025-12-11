import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  date: string;
  time: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateName, candidateEmail, companyName, date, time }: BookingEmailRequest = await req.json();

    console.log("Sending booking confirmation email to:", candidateEmail);
    console.log("Details:", { candidateName, companyName, date, time });

    const emailResponse = await resend.emails.send({
      from: "FeriaMatch <onboarding@resend.dev>",
      to: [candidateEmail],
      subject: "Confirmación de Entrevista - FeriaMatch",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✨ ¡Entrevista Confirmada!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px 24px;">
                      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                        Hola <strong>${candidateName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                        Has confirmado tu entrevista con éxito. Aquí están los detalles:
                      </p>
                      
                      <!-- Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 12px;">
                                  <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Empresa</span>
                                  <p style="margin: 4px 0 0; color: #18181b; font-size: 16px; font-weight: 600;">${companyName}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 12px;">
                                  <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</span>
                                  <p style="margin: 4px 0 0; color: #18181b; font-size: 16px; font-weight: 600;">📅 ${date}</p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Hora</span>
                                  <p style="margin: 4px 0 0; color: #18181b; font-size: 16px; font-weight: 600;">⏰ ${time}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                        <strong>¡Mucha suerte!</strong> Te recomendamos llegar unos minutos antes de tu cita.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 20px 24px; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                        Este correo fue enviado por FeriaMatch.<br>
                        Por favor no responder a este correo.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
