// Configuración de la API Key.
// IMPORTANTE: Al ser un entorno frontend puro, la key queda expuesta.
// Para uso interno personal está bien, pero no para producción pública.
const API_KEY = 'TU_API_KEY_AQUI'; 

export interface GenerateTextParams {
  prompt: string;
  context?: string;
  tone?: string;
}

/**
 * Genera contenido de texto utilizando la API REST de Gemini.
 * Reemplaza al SDK para evitar problemas de compatibilidad en navegadores sin bundler.
 */
export const generateDraft = async (params: GenerateTextParams): Promise<string> => {
  const { prompt, context, tone } = params;

  // Construcción de la instrucción del sistema
  const systemInstructionText = `
    Eres un asistente de redacción experto para entornos corporativos y técnicos.
    Tu objetivo es ayudar a redactar correos, reportes o tareas de manera clara y profesional.
    ${tone ? `El tono debe ser: ${tone}.` : ''}
    ${context ? `Contexto adicional: ${context}.` : ''}
  `;

  // Estructura del cuerpo para la API REST de Gemini
  // Documentación: https://ai.google.dev/api/rest/v1beta/models/generateContent
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      temperature: 0.7,
    }
  };

  try {
    // Usamos el modelo gemini-1.5-flash que es estable y rápido para estas tareas
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", errorData);
      throw new Error(`Error HTTP: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extracción segura del texto de la respuesta JSON
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return generatedText || "No se pudo generar el contenido (Respuesta vacía).";
  } catch (error) {
    console.error("Error generating draft:", error);
    throw new Error("Error al comunicarse con el servicio de IA. Verifica tu API Key y conexión.");
  }
};