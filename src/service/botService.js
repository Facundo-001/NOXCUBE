import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BANNED_WORDS = [
    // Discriminación y odio
    'nigger', 'nigga', 'negro de mierda', 'puto', 'puta', 'maricón', 'maricon',
    'judío de mierda', 'judio de mierda', 'nazi', 'hitler',
    
    // Amenazas graves
    'te voy a matar', 'te voy a violar', 'voy a quemar', 'bomba',
    'terrorista', 'masacre', 'tiroteo',
    
    // Acoso sexual grave
    'violación', 'violacion', 'abuso sexual', 'pedofilo', 'pedófilo', 'pederasta',
    
    // Doxxeo e info personal
    'número de teléfono', 'dirección de casa', 'documento de identidad',
    
    // Spam comercial agresivo
    'compra seguidores', 'venta de cuentas', 'hackeo de cuentas',
    'droga', 'cocaína', 'marihuana', 'fentanilo', 'metanfetamina'
];

const SPAM_PATTERNS = [
    /(.)\1{8,}/g,                    // Letra repetida 9+ veces (spam)
    /[A-Z]{15,}/g,                    // MAYÚSCULAS 15+ seguidas (gritos)
    /.{2000,}/g,                      // Mensajes excesivamente largos
    /(https?:\/\/){3,}/g,             // 3+ links en un mismo mensaje
    /(\S+ ){50,}\S+/g                 // 50+ palabras sin pausa (copy-paste masivo)
];

export function moderateText(text) {
    let flags = [];
    let cleanText = text;

    for (const word of BANNED_WORDS) {
        if (cleanText.toLowerCase().includes(word)) {
            flags.push('banned_word');
            cleanText = cleanText.replace(new RegExp(word, 'gi'), '***');
        }
    }

    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(text)) {
            flags.push('spam');
            break;
        }
    }

    if (text.length > 2000) flags.push('too_long');
    if (text.trim().length === 0) flags.push('empty');

    return { flags, cleanText, isFlagged: flags.length > 0 };
}

export async function logBotAction(action, targetId, details) {
    const botRef = collection(db, 'bot_logs');
    await addDoc(botRef, {
        action,
        targetId,
        details,
        timestamp: serverTimestamp()
    });
}

export async function autoModerate(content, type, userId = null) {
    // Si es el admin, no moderar
    const ADMIN_UID = 'hVKsAtCptMSJ8ooHV1uIeFWodbe2';
    if (userId === ADMIN_UID) {
        return { flags: [], cleanText: content, isFlagged: false };
    }

    const result = moderateText(content);
    if (result.isFlagged) {
        await logBotAction('auto_moderate', type, {
            flags: result.flags,
            originalLength: content.length
        });
    }
    return result;
}

export function getBotStatus() {
    return {
        online: true,
        bannedWordsCount: BANNED_WORDS.length,
        spamPatterns: SPAM_PATTERNS.length,
        uptime: Math.floor(performance.now() / 1000)
    };
}