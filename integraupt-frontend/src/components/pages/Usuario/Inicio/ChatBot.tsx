import { useEffect } from "react";
import "@n8n/chat/style.css";
import { createChat } from "@n8n/chat";

export const ChatBot = () => {
  useEffect(() => {
    createChat({
      webhookUrl: "https://integraupt.app.n8n.cloud/webhook/90d7c8ff-a0bf-49f6-8697-115cb53ae8c4/chat",
      mode: "window",
      initialMessages: [
        "¡Hola! 😀👋",
        "Soy el asistente de IntegraUPT. ¿Qué necesitas?"
      ],
      i18n: {
        es: {
          title: "Bienvenido 👋",
          subtitle: "Estoy aquí para ayudarte.",
          footer: "Creado por IntegraUPT",
          getStarted: "Comenzar",
          inputPlaceholder: "Escribe tu consulta...",
          closeButtonTooltip: "Cerrar",
        }
      },
      defaultLanguage: "es" as any,
      loadPreviousSession: true,
    });
  }, []);

  return null;
};
