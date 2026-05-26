# Genera Word con la lista de pendientes del Portal ENCOSEP

$out = "C:\Users\gje_9\Claude\01_ENCOSEP\Pendientes Portal ENCOSEP.docx"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()

# Estilo base
$doc.Range.Font.Name = "Calibri"
$doc.Range.Font.Size = 11
$doc.Range.ParagraphFormat.LineSpacingRule = 0  # Single

function H1([string]$text) {
    $r = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $r.Text = "$text`r"
    $r.Style = "Encabezado 1"
}
function H2([string]$text) {
    $r = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $r.Text = "$text`r"
    $r.Style = "Encabezado 2"
}
function H3([string]$text) {
    $r = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $r.Text = "$text`r"
    $r.Style = "Encabezado 3"
}
function P([string]$text) {
    $r = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $r.Text = "$text`r"
    $r.Style = "Normal"
}
function Bold([string]$text) {
    $r = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $r.Font.Bold = $true
    $r.Text = "$text`r"
    $r.Font.Bold = $false
}

# ============ CONTENIDO ============

H1 "Pendientes del Portal ENCOSEP"

P "Documento de relevamiento de tareas pendientes para las próximas sesiones de trabajo sobre el Portal del Ente de Control de los Servicios Públicos de Comodoro Rivadavia."
P ""

P "URL pública del Portal: https://reclamosencosep.vercel.app"
P "Repositorio del código: https://github.com/directorezequielgarcia/reclamosencosep"
P "Fecha del relevamiento: 26 de mayo de 2026"
P ""

H2 "Estado actual"

P "El Portal cuenta hoy con sitio institucional completo, sistema de reclamos del vecino con foto y GPS, panel administrativo del Ente con expedientes administrativos, módulo de documentación para prestadoras, calendario de vencimientos, boletines y comunicaciones, audiencias públicas con inscripción ciudadana, indicadores públicos en tiempo real y encuesta general de satisfacción. Todo está desplegado en producción, accesible desde cualquier dispositivo y conectado a base de datos PostgreSQL gestionada por Neon."
P ""
P "Los pendientes a continuación se organizan en cuatro niveles de prioridad. Cada uno incluye el alcance, por qué importa, quién lo aporta y el esfuerzo estimado del lado técnico."
P ""

# ============ PRIORIDAD ALTA - DATOS ============

H2 "Prioridad ALTA — Datos reales del equipo y prestadoras"

H3 "1. DNI reales del equipo del Ente"
P "Hoy los cuatro colaboradores institucionales —Adriana Almonacid, Marcos Barrionuevo, Yanina del Bono y Julieta Palacios— están cargados con DNI temporales numerados del 11111111 al 44444444. Estos identificadores funcionan, pero conviene reemplazarlos por los DNI reales de cada persona para que el login refleje fielmente la identidad institucional y se pueda usar el mismo número que figura en cualquier nota o expediente interno."
P "Quién aporta: el Directorio, con los datos del legajo de cada uno."
P "Esfuerzo técnico: 5 minutos por persona (script de actualización)."
P ""

H3 "2. CUITs reales de las prestadoras"
P "De las cuatro prestadoras controladas, sólo SCPL tiene cargado un CUIT que se aproxima al real. CLEAR URBANA, PATAGONIA Argentina S.R.L. y TRANSPORTE DIADEMA S.A. están cargadas con CUITs marcadores (30710000001, 002 y 003 respectivamente). Cuando se obtengan los CUITs verdaderos, se actualizan los registros de cada empresa y el identificador con el que cada operador hace login, sin perder permisos ni reclamos asignados."
P "Quién aporta: las propias prestadoras o la mesa de entradas del Ente."
P "Esfuerzo técnico: 15 minutos."
P ""

H3 "3. Claves seguras definitivas"
P "Hoy todos los usuarios institucionales comparten una clave temporal: encosep-2026 para los colaboradores, scpl-2026/clear-2026/patagonia-2026/diadema-2026 para las prestadoras y demo1234 para los demos. Estas claves son útiles para arrancar pero deben reemplazarse antes de pasar a producción real. La forma correcta es habilitar una pantalla 'Cambiar mi contraseña' en el panel admin (ver punto 6) para que cada persona elija su propia clave."
P "Esfuerzo técnico: incluido en el punto 6."
P ""

H3 "4. Fotos y biografías de directores y colaboradores"
P "El sitio público muestra el directorio (Cristian Serdeiro, Ezequiel García, Maximiliano López) y los cuatro responsables de área únicamente con su nombre. Para fortalecer la presencia institucional, conviene contar con foto profesional de cada persona y una breve biografía o trayectoria (3-5 líneas). Estas fotos y textos van a verse en la sección Nosotros del sitio y eventualmente en una página de Equipo más extendida."
P "Quién aporta: el área de Comunicación (Marcos) puede coordinar las fotos."
P "Esfuerzo técnico: una vez que estén las fotos, 30 minutos de carga."
P ""

# ============ PRIORIDAD ALTA - FUNCIONALIDAD ============

H2 "Prioridad ALTA — Funcionalidad faltante"

H3 "5. Formulario admin para gestión de audiencias"
P "La audiencia del 27 de mayo (Exp.014-2026 SCPL) está cargada manualmente con un script. Para que el área de Comunicación pueda crear y editar audiencias por su cuenta, hay que ampliar la interfaz de /admin/audiencias con: edición de cada audiencia ya creada, upload del PDF del expediente, upload del orden del día, marcar como REALIZADA cuando ocurra, upload del acta posterior y carga del texto del acta. Hoy la página /admin/audiencias permite crear pero no editar ni adjuntar archivos."
P "Quién lo usa: Marcos Barrionuevo principalmente."
P "Esfuerzo técnico: una hora aproximada."
P ""

H3 "6. Pantalla Cambiar mi contraseña"
P "Hoy las claves se asignan al crear el usuario y no hay forma de cambiarlas desde la interfaz. Construir una pantalla simple en /admin/mi-cuenta donde cualquier usuario logueado pueda ingresar su clave actual y una nueva clave deseada. Esto resuelve el punto 3 (claves seguras) sin necesidad de que yo intervenga."
P "Quién lo usa: todos los usuarios."
P "Esfuerzo técnico: media hora."
P ""

H3 "7. CMS del sitio institucional"
P "Hoy el contenido del sitio —directores, datos de contacto, textos de la misión, plan estratégico, etcétera— vive dentro del código. Para que el Directorio o el área de Comunicación pueda modificar esos textos y fotos sin pedir intervención técnica, hay que construir un panel /admin/configuracion-sitio donde se puedan editar campos clave. Incluye gestión de imágenes (subida vía Vercel Blob), edición de textos con formato simple, gestión de directores (orden, foto, biografía) y gestión de los datos de contacto del footer."
P "Quién lo usa: Directorio + Comunicación."
P "Esfuerzo técnico: tres horas aproximadamente."
P ""

H3 "8. Notificaciones automáticas por email"
P "Cuando un reclamo cambia de estado o cuando una prestadora sube un documento, hoy nadie recibe aviso automático. Conviene integrar un servicio de envío de mail (Resend es la opción más simple y barata) para mandar: aviso al vecino cuando su reclamo es derivado, en proceso, resuelto o rechazado; aviso al operador prestadora cuando se le asigna un reclamo nuevo; aviso al Ente cuando una prestadora sube un documento; aviso al vecino con el código de inscripción cuando se anota a una audiencia. Cada mail incluye link directo a la página relevante."
P "Esfuerzo técnico: hora y media para el módulo más cinco minutos por cada tipo de notificación."
P ""

# ============ PRIORIDAD MEDIA - VISIBLE ============

H2 "Prioridad MEDIA — Mejoras visibles"

H3 "9. Mapa operativo en el panel admin"
P "Hoy el detalle de cada reclamo muestra un mapa con el punto. Falta una vista agregada donde se vean TODOS los reclamos georeferenciados en un solo mapa de la ciudad, con clusters por barrio, filtros por servicio y por estado, y links rápidos al detalle de cada uno. Es la herramienta que Julieta usaría para planificar inspecciones territoriales (qué zonas concentran más reclamos esta semana)."
P "Esfuerzo técnico: dos horas."
P ""

H3 "10. PWA instalable"
P "Convertir el sitio en una Progressive Web App permite que el vecino pueda 'instalar' el portal en su pantalla de inicio del celular, como si fuera una app nativa, y que funcione parcialmente sin conexión. Requiere agregar un archivo manifest.webmanifest, un service worker y un set de íconos en distintos tamaños. La ventaja es que aprovecha todo el sitio existente sin desarrollar una app Android o iOS por separado, y se mantiene siempre actualizado automáticamente."
P "Esfuerzo técnico: una hora y media."
P ""

H3 "11. Exportación a Excel"
P "Tanto la bandeja de reclamos como el listado de documentación y el de vencimientos hoy se ven solo en pantalla. Agregar un botón 'Exportar a Excel' en cada uno permite que las áreas usen los datos para sus informes mensuales (los que se elaboran fuera del sistema, por ejemplo en la generación del informe mensual del Ente)."
P "Esfuerzo técnico: media hora por listado."
P ""

H3 "12. Mapa público de reclamos del barrio"
P "Una página pública /mapa o /mapa-publico donde cualquier vecino, sin loguearse, ve los reclamos del barrio en un mapa de la ciudad (anonimizados: sin nombre del vecino, sólo dirección general y tipo de reclamo). Sirve como herramienta de transparencia: cualquiera puede comprobar que su vecino también reclamó y que el problema existe. Datos agregados para evitar exposición individual."
P "Esfuerzo técnico: una hora."
P ""

H3 "13. Integración con WhatsApp Business"
P "Para complementar el email, integrar WhatsApp Business como canal de notificación. La prestadora puede recibir el aviso de un reclamo nuevo por WhatsApp, el vecino el resultado del trámite, etcétera. Requiere abrir cuenta WhatsApp Business API (proveedor recomendado: Twilio o Meta directo), aprobar plantillas de mensaje y conectar al sistema."
P "Quién aporta: alguien con DNI/CUIT empresa para abrir la cuenta WA Business."
P "Esfuerzo técnico del lado código: dos horas. Setup administrativo: depende de aprobación de Meta."
P ""

# ============ PRIORIDAD MEDIA - PRODUCCION ============

H2 "Prioridad MEDIA — Producción real"

H3 "14. Apuntar dominio .gob.ar a Vercel"
P "Hoy el sitio se sirve en reclamosencosep.vercel.app. Para que tenga apariencia y autoridad institucional plena, conviene apuntar el dominio encosepcomodoro.gob.ar (el actual del Ente) al nuevo portal en Vercel. Esto requiere un cambio de DNS en el panel del Municipio (donde está delegado el .gob.ar), coordinado con el IT municipal. Una vez hecho el cambio, el portal nuevo reemplaza al actual sin que el vecino tenga que cambiar de URL."
P "Quién decide: Directorio + IT del Municipio."
P "Esfuerzo técnico del lado portal: 10 minutos para configurar el dominio en Vercel."
P ""

H3 "15. Términos y Condiciones y Política de Privacidad"
P "El portal recibe datos personales del vecino (DNI, nombre, email, fotos, ubicación GPS). Para cumplir con la Ley de Protección de Datos Personales (Ley 25.326) hay que publicar dos textos legales: Términos y Condiciones de uso del portal, y Política de Privacidad explicando qué datos se recolectan, para qué se usan y cómo se puede solicitar baja o rectificación. Idealmente revisados por el área jurídica del Municipio o un abogado especialista."
P "Quién aporta: área jurídica."
P "Esfuerzo técnico: 30 minutos de carga de textos."
P ""

H3 "16. Optimización de imágenes pesadas"
P "Algunas imágenes del sitio están en formatos no óptimos. La foto panorámica de Comodoro pesa 8 MB en PNG y la del logo combinado con la foto otros 3 MB. Convertirlas a formato WebP reduce el peso a 500 KB sin pérdida visible y mejora notablemente la velocidad de carga, especialmente en móviles con conexión 3G/4G no óptima. El expediente PDF de la audiencia (36 MB) también podría comprimirse."
P "Esfuerzo técnico: 30 minutos."
P ""

H3 "17. Rate limiting en endpoints públicos"
P "Los formularios públicos —encuesta de satisfacción, inscripción a audiencias— hoy no tienen protección contra envío masivo automático. Conviene agregar limitación de velocidad por dirección IP (máximo X envíos por minuto) para evitar spam o bots. Vercel ofrece esto de forma nativa con configuración."
P "Esfuerzo técnico: 45 minutos."
P ""

H3 "18. Backup automático de la base"
P "La base de datos PostgreSQL en Neon ya hace backups automáticos, pero conviene configurar un backup adicional descargable a un Google Drive o servicio externo del Ente, con frecuencia semanal o diaria. Es seguro institucional ante cualquier eventualidad con el proveedor."
P "Esfuerzo técnico: 30 minutos de setup."
P ""

# ============ PRIORIDAD BAJA ============

H2 "Prioridad BAJA — Mejoras futuras"

H3 "19. Integración real con RENAPER"
P "Hoy el vecino se registra con DNI + clave que él mismo elige. Para validar que el DNI realmente corresponde a esa persona, habría que integrar con el padrón RENAPER (Registro Nacional de las Personas) o el padrón del Tribunal Electoral. Esto requiere convenio formal con el organismo nacional/provincial y consumir un API restringido. La ventaja es que evita registraciones falsas y da validez legal plena a cada reclamo."
P "Esfuerzo técnico: depende del convenio (tres a cinco horas si se concreta el acceso)."
P ""

H3 "20. Newsletter para vecinos"
P "Permitir que cualquier vecino suscriba su email para recibir un boletín mensual o quincenal con: cantidad de reclamos resueltos, audiencias próximas, novedades del Ente. Aprovecha la infraestructura de email del punto 8."
P "Esfuerzo técnico: una hora."
P ""

H3 "21. Importar Boletín Oficial municipal automáticamente"
P "Si el Boletín Oficial de Comodoro Rivadavia publica una norma nueva relevante para los servicios públicos, hoy hay que cargarla a mano en el módulo Boletines. Se podría desarrollar un job automático que diariamente lea el Boletín Oficial municipal, detecte normas vinculadas a los servicios bajo control del Ente y las cargue automáticamente con estado borrador para que Marcos las revise y publique. Requiere que el Boletín Oficial municipal tenga un feed o API público (a verificar)."
P "Esfuerzo técnico: dos a cuatro horas."
P ""

H3 "22. App nativa Android/iOS"
P "Una vez que se valide adopción del portal como PWA, se podría empaquetar como app nativa en Play Store y App Store. La ventaja es presencia oficial en las tiendas y push notifications más confiables. La desventaja es revisión de cada tienda y necesidad de cuenta de desarrollador (Apple cuesta 99 USD anuales). No es prioritario para empezar."
P "Esfuerzo técnico: doce horas distribuidas entre adaptaciones, builds y publicación."
P ""

H3 "23. Auditoría de acciones administrativas"
P "Registro completo de todas las acciones de los usuarios del panel admin: quién creó qué, quién modificó qué, quién borró qué, con timestamp e IP. Hoy hay un registro básico (los eventos de reclamos), pero no un audit log institucional completo. Importante para auditorías internas y para responder ante eventuales cuestionamientos sobre intervención sobre expedientes."
P "Esfuerzo técnico: tres horas."
P ""

H3 "24. Calendario de inspecciones de Julieta"
P "Hoy Julieta carga las inspecciones como parte de las Acciones (fotos en /acciones). Un módulo más estructurado tendría: planificación de las próximas inspecciones (calendario semanal), registro de cada inspección con barrio, motivo, fotos, observaciones y eventual derivación a expediente. Sirve también para el Informe Mensual: cantidad de inspecciones realizadas, qué se detectó, qué se derivó."
P "Esfuerzo técnico: tres a cuatro horas."
P ""

# ============ RECOMENDACION ============

H2 "Recomendación de orden para próximas sesiones"

P "Si tuviera que sugerir un orden de trabajo, sería el siguiente:"
P ""

H3 "Sesión próxima — Autonomía del equipo"
P "Atacar los tres puntos que permiten que el equipo del Ente se vuelva autónomo y deje de depender de mi intervención para tareas operativas:"
P "Punto 6 (Cambiar mi contraseña), Punto 5 (Form admin de Audiencias), Punto 7 (CMS del sitio institucional)."
P "Con esto los cuatro responsables (Adriana, Marcos, Yanina y Julieta) y el Directorio pueden trabajar el sitio y los datos sin intermediario técnico."
P ""

H3 "Sesión siguiente — Comunicación y territorio"
P "Una vez resuelta la autonomía, atacar los puntos que hacen el portal más operativo en el día a día: Punto 8 (Notificaciones por email), Punto 9 (Mapa operativo en admin), Punto 10 (PWA instalable). Esto mejora la experiencia tanto del vecino como del equipo."
P ""

H3 "Sesión de cierre — Producción institucional"
P "Cuando el portal esté validado por el uso real durante algunas semanas, encarar los puntos de producción definitiva: Punto 14 (dominio .gob.ar), Punto 15 (Términos legales), Punto 16 (Optimización), Punto 17 (Rate limiting). Esto convierte el portal de 'piloto' a 'producción institucional'."
P ""

H3 "Datos del usuario en paralelo"
P "En paralelo a todo lo anterior, los puntos 1 (DNI), 2 (CUITs), 3 (Claves) y 4 (Fotos) no dependen de mí sino del Directorio y del equipo. Cualquier momento que el usuario tenga esos datos, me los pasa y los actualizo en minutos."
P ""

H2 "Cierre"

P "El portal en su estado actual ya es funcional, deployable y permite mostrar al Directorio, al Concejo y a la comunidad un trabajo concreto y avanzado. Los pendientes listados son mejoras incrementales sobre una base sólida, no bloqueos críticos. La prioridad sugerida ayuda a que cada nueva sesión sume valor visible y libere al equipo de tareas dependientes del soporte técnico."
P ""
P "Dr. Cr. Ezequiel García"
P "Director — ENCOSEP"

# ============ GUARDAR ============

$doc.SaveAs([ref] $out, [ref] 16) # 16 = wdFormatDocumentDefault (.docx)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

Write-Host "Documento generado: $out"
$size = (Get-Item $out).Length
Write-Host "Tamaño: $([math]::Round($size/1KB)) KB"
