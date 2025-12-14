import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingRequestEmailRequest {
  type: "request_to_company" | "approval_to_candidate";
  // For request_to_company
  companyEmail?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateCvUrl?: string | null;
  date?: string;
  time?: string;
  // For approval_to_candidate
  companyName?: string;
}

// Simple validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidString = (str: string | undefined | null, maxLength: number): boolean => {
  if (!str) return true; // optional fields
  return typeof str === 'string' && str.length <= maxLength;
};

const sanitizeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Get user role for authorization
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error("Failed to fetch user role:", roleError.message);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Could not verify user role' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userRole = userRoleData?.role;
    console.log("User role:", userRole);

    const data: BookingRequestEmailRequest = await req.json();
    
    console.log("Processing email request:", data.type);

    // Validate email type
    if (!['request_to_company', 'approval_to_candidate'].includes(data.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email type' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authorization checks based on email type
    if (data.type === "request_to_company") {
      // Only candidates can request interviews
      if (userRole !== 'candidate') {
        console.error("Non-candidate trying to send request_to_company email");
        return new Response(
          JSON.stringify({ error: 'Forbidden - Only candidates can request interviews' }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (data.type === "approval_to_candidate") {
      // Only recruiters and admins can approve bookings
      if (!['recruiter', 'admin'].includes(userRole)) {
        console.error("Non-recruiter/admin trying to send approval email");
        return new Response(
          JSON.stringify({ error: 'Forbidden - Only recruiters can approve bookings' }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate input fields
    if (data.companyEmail && !isValidEmail(data.companyEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid company email format' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (data.candidateEmail && !isValidEmail(data.candidateEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid candidate email format' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidString(data.candidateName, 100) || 
        !isValidString(data.companyName, 100) ||
        !isValidString(data.date, 50) ||
        !isValidString(data.time, 50)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: field too long' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate CV URL if provided
    if (data.candidateCvUrl) {
      try {
        const url = new URL(data.candidateCvUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
        if (data.candidateCvUrl.length > 500) {
          throw new Error('URL too long');
        }
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid CV URL format' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    let emailResponse;

    if (data.type === "request_to_company") {
      // Email to company about new booking request
      const { companyEmail, candidateName, candidateEmail, candidateCvUrl, date, time } = data;
      
      if (!companyEmail) {
        throw new Error("Company email is required");
      }

      console.log("Sending booking request notification to company:", companyEmail);

      // Sanitize user inputs for HTML
      const safeCandidateName = sanitizeHtml(candidateName);
      const safeCandidateEmail = sanitizeHtml(candidateEmail);
      const safeDate = sanitizeHtml(date);
      const safeTime = sanitizeHtml(time);

      const cvSection = candidateCvUrl 
        ? `<tr>
             <td style="padding-top: 12px;">
               <a href="${encodeURI(candidateCvUrl)}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                 📄 Ver CV del Candidato
               </a>
             </td>
           </tr>`
        : '';

      emailResponse = await resend.emails.send({
        from: "FeriaMatch <onboarding@resend.dev>",
        to: [companyEmail],
        subject: `Nueva Solicitud de Entrevista: ${safeCandidateName}`,
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
                      <td style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🔔 Nueva Solicitud de Entrevista</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                          <strong>${safeCandidateName}</strong> ha solicitado una entrevista contigo.
                        </p>
                        
                        <!-- Details Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Candidato</span>
                                    <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">${safeCandidateName}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
                                    <p style="margin: 4px 0 0; color: #78350f; font-size: 14px;">${safeCandidateEmail}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</span>
                                    <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">📅 ${safeDate}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <span style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Hora</span>
                                    <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">⏰ ${safeTime}</p>
                                  </td>
                                </tr>
                                ${cvSection}
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                          Entra en tu <strong>Dashboard</strong> para aceptar o rechazar esta solicitud.
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
    } else if (data.type === "approval_to_candidate") {
      // Email to candidate about approved booking
      const { candidateName, candidateEmail, companyName, date, time } = data;
      
      if (!candidateEmail) {
        throw new Error("Candidate email is required");
      }

      console.log("Sending approval notification to candidate:", candidateEmail);

      // Sanitize user inputs for HTML
      const safeCandidateName = sanitizeHtml(candidateName);
      const safeCompanyName = sanitizeHtml(companyName);
      const safeDate = sanitizeHtml(date);
      const safeTime = sanitizeHtml(time);

      emailResponse = await resend.emails.send({
        from: "FeriaMatch <onboarding@resend.dev>",
        to: [candidateEmail],
        subject: "¡Buenas Noticias! Tu Solicitud fue Aceptada - FeriaMatch",
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
                      <td style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ ¡Solicitud Aceptada!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                          Hola <strong>${safeCandidateName}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                          ¡Buenas noticias! <strong>${safeCompanyName}</strong> ha aceptado tu solicitud de entrevista.
                        </p>
                        
                        <!-- Details Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dcfce7; border-radius: 8px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Empresa</span>
                                    <p style="margin: 4px 0 0; color: #14532d; font-size: 16px; font-weight: 600;">${safeCompanyName}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</span>
                                    <p style="margin: 4px 0 0; color: #14532d; font-size: 16px; font-weight: 600;">📅 ${safeDate}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <span style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Hora</span>
                                    <p style="margin: 4px 0 0; color: #14532d; font-size: 16px; font-weight: 600;">⏰ ${safeTime}</p>
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
    } else {
      throw new Error("Invalid email type");
    }

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
