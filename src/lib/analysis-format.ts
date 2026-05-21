export function stripMarkdown(markdown: string) {
    return markdown
        .replace(/^#\s*(?:[^\nA-Za-z0-9]*)?\s*Analisis OmniPsyche:[^\n]*\n+/i, " ")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#*_`>~-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function createExcerpt(markdown: string, maxLength = 180) {
    const text = stripMarkdown(markdown);

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
}

export function formatDateTime(date: Date | string) {
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
