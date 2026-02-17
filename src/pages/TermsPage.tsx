import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-brand-dark text-zinc-300">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-sm font-bold">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Inicio
                </Link>

                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Términos de Servicio</h1>
                <p className="text-zinc-600 text-sm mb-12">Última actualización: 16 de febrero de 2026</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">1. Aceptación de los Términos</h2>
                        <p>Al acceder y utilizar Tiender ("el Servicio"), aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">2. Descripción del Servicio</h2>
                        <p>Tiender es una plataforma SaaS que permite a los usuarios crear catálogos digitales de productos con una experiencia de compra social tipo "swipe", integrar pagos a través de WhatsApp y gestionar sus tiendas en línea.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">3. Registro y Cuenta</h2>
                        <p>Para utilizar el Servicio, debes crear una cuenta proporcionando información precisa y completa. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. Debes tener al menos 18 años para usar el Servicio.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">4. Planes y Pagos</h2>
                        <p>Tiender ofrece planes de suscripción pagados. Al suscribirte a un plan, autorizas cobros recurrentes a través de PayPal. Los precios están sujetos a cambios con notificación previa de 30 días. Cada plan incluye un período de prueba gratuito de 7 días.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">5. Contenido del Usuario</h2>
                        <p>Eres el único responsable del contenido que publicas a través del Servicio, incluyendo productos, imágenes y descripciones. Garantizas que tienes los derechos necesarios sobre dicho contenido y que este no infringe derechos de terceros ni leyes aplicables.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">6. Uso Aceptable</h2>
                        <p>No puedes usar el Servicio para actividades ilegales, fraudulentas, o que violen los derechos de terceros. Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos sin previo aviso.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">7. Cancelación</h2>
                        <p>Puedes cancelar tu suscripción en cualquier momento desde tu panel de control. Al cancelar, mantendrás acceso al Servicio hasta el final del período de facturación actual. No se ofrecen reembolsos por períodos parciales.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">8. Limitación de Responsabilidad</h2>
                        <p>Tiender se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos responsables por pérdidas de datos, interrupciones del servicio, ni por daños indirectos derivados del uso del Servicio.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">9. Modificaciones</h2>
                        <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor 30 días después de su publicación. El uso continuado del Servicio después de dicho período constituye la aceptación de los nuevos términos.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-3">10. Contacto</h2>
                        <p>Para cualquier consulta sobre estos Términos, puedes contactarnos a través de nuestros canales oficiales en la plataforma.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
