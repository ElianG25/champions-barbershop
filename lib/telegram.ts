export async function sendTelegramMessage(message: string, chatId?: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const resolvedChatId = chatId || process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !resolvedChatId) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: resolvedChatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
}