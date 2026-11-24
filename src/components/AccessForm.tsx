import { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, CheckCircle2, Copy, Mail, ShieldCheck } from 'lucide-react';
import {
  createSafeDocId,
  db,
  handleFirestoreError,
  OperationType,
  sanitizeInput,
  VALIDATION_LIMITS,
} from '../firebase';

type DevicePlatform = 'Web' | 'iOS' | 'Android';

interface SubmitResult {
  requestId: string;
  mode: 'smtp' | 'mailto';
  recipient: string;
  subject: string;
  textBody: string;
  mailtoUrl: string;
  savedName: string;
  savedPlatform: DevicePlatform;
}

export function AccessForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<DevicePlatform>('Web');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (website.trim().length > 0) {
      setError('Solicitud bloqueada por validación de seguridad.');
      return;
    }

    const cleanName = sanitizeInput(name, VALIDATION_LIMITS.NAME_MAX);
    const cleanEmail = sanitizeInput(email, VALIDATION_LIMITS.EMAIL_MAX).toLowerCase();
    const cleanNote = sanitizeInput(note, VALIDATION_LIMITS.NOTE_MAX);

    if (cleanName.length < VALIDATION_LIMITS.NAME_MIN) {
      setError('Por favor ingresa tu nombre completo (mínimo 2 caracteres).');
      return;
    }

    if (
      cleanEmail.length < VALIDATION_LIMITS.EMAIL_MIN ||
      !VALIDATION_LIMITS.EMAIL_REGEX.test(cleanEmail)
    ) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/solicitar-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          platform,
          note: cleanNote,
          website,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'No se pudo procesar la solicitud.');
        return;
      }

      const deliveryMode: 'smtp' | 'mailto' =
        data.mode === 'smtp' ? 'smtp' : 'mailto';

      const requestId = createSafeDocId('req');
      const collectionPath = `accessRequests/${requestId}`;

      try {
        await setDoc(doc(db, 'accessRequests', requestId), {
          name: cleanName,
          email: cleanEmail,
          platform,
          note: cleanNote,
          recipientEmail: 'tulookoffve@gmail.com',
          deliveryMode,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.CREATE, collectionPath);
      }

      const result: SubmitResult = {
        requestId,
        mode: deliveryMode,
        recipient: 'tulookoffve@gmail.com',
        subject: data.subject,
        textBody: data.textBody,
        mailtoUrl: data.mailtoUrl,
        savedName: cleanName,
        savedPlatform: platform,
      };

      setSubmitResult(result);

      if (result.mode === 'mailto') {
        const mailAnchor = document.createElement('a');
        mailAnchor.href = result.mailtoUrl;
        mailAnchor.style.display = 'none';
        document.body.appendChild(mailAnchor);
        mailAnchor.click();
        document.body.removeChild(mailAnchor);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('{')) {
        throw err;
      }
      setError('No se pudo completar el envío en este momento. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!submitResult) return;
    const fullText = `Para: ${submitResult.recipient}\nAsunto: ${submitResult.subject}\n\n${submitResult.textBody}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (submitResult) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl bg-white border border-[#141413] p-8 space-y-5"
      >
        <div className="flex items-start gap-3 text-[#7F1D3A]">
          <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
              ¡Solicitud enviada con éxito!
            </h3>
            <p className="text-xs font-medium text-[#524F49] tabular-nums">
              Registro protegido en base de datos · Folio {submitResult.requestId}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[#524F49]">
          {submitResult.mode === 'smtp' ? (
            <>
              Tu solicitud para <span className="font-medium text-[#141413]">{submitResult.savedName}</span> ({submitResult.savedPlatform}) fue guardada y enviada por correo directamente a{' '}
              <span className="font-medium text-[#141413]">{submitResult.recipient}</span>.
            </>
          ) : (
            <>
              Tu solicitud para <span className="font-medium text-[#141413]">{submitResult.savedName}</span> ({submitResult.savedPlatform}) quedó guardada de forma segura y preparamos el correo para{' '}
              <span className="font-medium text-[#141413]">{submitResult.recipient}</span>. Si tu aplicación de correo no se abrió automáticamente, confirma el envío con el botón de abajo.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={submitResult.mailtoUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#7F1D3A] text-white hover:bg-[#67162E] transition-colors whitespace-nowrap shrink-0"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span>Abrir correo a tulookoffve@gmail.com</span>
          </a>

          <button
            type="button"
            onClick={handleCopyMessage}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#D8D3C8] text-[#141413] hover:border-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#7F1D3A]" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{copied ? 'Mensaje copiado' : 'Copiar mensaje'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitResult(null);
              setName('');
              setEmail('');
              setNote('');
              setCopied(false);
            }}
            className="px-4 py-2.5 text-sm font-medium rounded-lg text-[#524F49] hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-white border border-[#DFDBD2] p-6 sm:p-8 space-y-5"
    >
      {/* Hidden anti-bot honeypot field */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="access-website">Sitio web</label>
        <input
          id="access-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="access-name" className="block text-xs font-medium text-[#524F49]">
            Nombre completo
          </label>
          <input
            id="access-name"
            type="text"
            required
            maxLength={VALIDATION_LIMITS.NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofía Larraín"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D8D3C8] rounded-lg text-[#141413] placeholder:text-[#8E8980] focus:outline-none focus:border-[#7F1D3A]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="access-email" className="block text-xs font-medium text-[#524F49]">
            Correo electrónico
          </label>
          <input
            id="access-email"
            type="email"
            required
            maxLength={VALIDATION_LIMITS.EMAIL_MAX}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D8D3C8] rounded-lg text-[#141413] placeholder:text-[#8E8980] focus:outline-none focus:border-[#7F1D3A]"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-[#524F49]">
          Plataforma preferida
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(['Web', 'iOS', 'Android'] as DevicePlatform[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlatform(item)}
              className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                platform === item
                  ? 'bg-[#141413] border-[#141413] text-white'
                  : 'bg-[#FAF9F6] border-[#D8D3C8] text-[#141413] hover:border-[#141413]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="access-note" className="block text-xs font-medium text-[#524F49]">
          ¿Qué necesitas organizar primero en TU LOOK? (opcional)
        </label>
        <input
          id="access-note"
          type="text"
          maxLength={VALIDATION_LIMITS.NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Armario de oficina, maleta de viaje, cápsula de temporada..."
          className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D8D3C8] rounded-lg text-[#141413] placeholder:text-[#8E8980] focus:outline-none focus:border-[#7F1D3A]"
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-[#991B1B]" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <p className="inline-flex items-center gap-1.5 text-xs text-[#6E6A61]">
          <ShieldCheck className="w-4 h-4 text-[#7F1D3A] shrink-0" aria-hidden="true" />
          <span>
            Envío protegido hacia{' '}
            <span className="font-medium text-[#141413]">tulookoffve@gmail.com</span>
          </span>
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-lg bg-[#7F1D3A] text-white text-sm font-medium hover:bg-[#67162E] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          {isSubmitting ? 'Enviando solicitud...' : 'Solicitar acceso a TU LOOK'}
        </button>
      </div>
    </form>
  );
}
