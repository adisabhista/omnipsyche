export const MBTI_TYPES = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    { id: "INTJ", name: "INTJ - The Architect", description: "Imaginative and strategic thinkers, with a plan for everything." },
    { id: "INTP", name: "INTP - The Logician", description: "Innovative inventors with an unquenchable thirst for knowledge." },
    { id: "ENTJ", name: "ENTJ - The Commander", description: "Bold, imaginative and strong-willed leaders, always finding a way - or making one." },
    { id: "ENTP", name: "ENTP - The Debater", description: "Smart and curious thinkers who cannot resist an intellectual challenge." },
    { id: "INFJ", name: "INFJ - The Advocate", description: "Quiet and mystical, yet very inspiring and tireless idealists." },
    { id: "INFP", name: "INFP - The Mediator", description: "Poetic, kind and altruistic people, always eager to help a good cause." },
    { id: "ENFJ", name: "ENFJ - The Protagonist", description: "Charismatic and inspiring leaders, able to mesmerize their listeners." },
    { id: "ENFP", name: "ENFP - The Campaigner", description: "Enthusiastic, creative and sociable free spirits, who can always find a reason to smile." },
    { id: "ISTJ", name: "ISTJ - The Logistician", description: "Practical and fact-minded individuals, whose reliability cannot be doubted." },
    { id: "ISFJ", name: "ISFJ - The Defender", description: "Very dedicated and warm protectors, always ready to defend their loved ones." },
    { id: "ESTJ", name: "ESTJ - The Executive", description: "Excellent administrators, unsurpassed at managing things - or people." },
    { id: "ESFJ", name: "ESFJ - The Consul", description: "Extraordinarily caring, social and popular people, always eager to help." },
    { id: "ISTP", name: "ISTP - The Virtuoso", description: "Bold and practical experimenters, masters of all kinds of tools." },
    { id: "ISFP", name: "ISFP - The Adventurer", description: "Flexible and charming artists, always ready to explore and experience something new." },
    { id: "ESTP", name: "ESTP - The Entrepreneur", description: "Smart, energetic and very perceptive people, who truly enjoy living on the edge." },
    { id: "ESFP", name: "ESFP - The Entertainer", description: "Spontaneous, energetic and enthusiastic people - life is never boring around them." },
];

export const ENNEAGRAM_TYPES = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    { id: 1, name: "Type 1 - The Reformer", description: "The Rational, Idealistic Type: Principled, Purposeful, Self-Controlled, and Perfectionistic." },
    { id: 2, name: "Type 2 - The Helper", description: "The Caring, Interpersonal Type: Demonstrative, Generous, People-Pleasing, and Possessive." },
    { id: 3, name: "Type 3 - The Achiever", description: "The Success-Oriented, Pragmatic Type: Adaptive, Excelling, Driven, and Image-Conscious." },
    { id: 4, name: "Type 4 - The Individualist", description: "The Sensitive, Withdrawn Type: Expressive, Dramatic, Self-Absorbed, and Temperamental." },
    { id: 5, name: "Type 5 - The Investigator", description: "The Intense, Cerebral Type: Perceptive, Innovative, Secretive, and Isolated." },
    { id: 6, name: "Type 6 - The Loyalist", description: "The Committed, Security-Oriented Type: Engaging, Responsible, Anxious, and Suspicious." },
    { id: 7, name: "Type 7 - The Enthusiast", description: "The Busy, Fun-Loving Type: Spontaneous, Versatile, Distractible, and Scattered." },
    { id: 8, name: "Type 8 - The Challenger", description: "The Powerful, Dominating Type: Self-Confident, Decisive, Willful, and Confrontational." },
    { id: 9, name: "Type 9 - The Peacemaker", description: "The Easygoing, Self-Effacing Type: Receptive, Reassuring, Agreeable, and Complacent." },
];

export const INSTINCTUAL_VARIANTS = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    { id: "sp/so", name: "Self-Preservation / Social", description: "Focus on security, comfort, and community belonging." },
    { id: "sp/sx", name: "Self-Preservation / Sexual", description: "Focus on security, comfort, and intense one-on-one bonds." },
    { id: "so/sp", name: "Social / Self-Preservation", description: "Focus on groups, status, and practical needs." },
    { id: "so/sx", name: "Social / Sexual", description: "Focus on groups, status, and chemistry." },
    { id: "sx/sp", name: "Sexual / Self-Preservation", description: "Focus on intensity, merging, and stability." },
    { id: "sx/so", name: "Sexual / Social", description: "Focus on intensity, merging, and social influence." },
];

export const TEMPERAMENTS = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    // Pure Types
    { id: "Sanguine", name: "Sanguine", description: "Enthusiastic, active, and social." },
    { id: "Choleric", name: "Choleric", description: "Short-tempered, fast, and irritable." },
    { id: "Melancholic", name: "Melancholic", description: "Analytical, wise, and quiet." },
    { id: "Phlegmatic", name: "Phlegmatic", description: "Relaxed and peaceful." },

    // Mixed Types (Dominant-Secondary)
    { id: "Sanguine-Choleric", name: "Sanguine-Choleric", description: "The most extroverted blend. Driven, enthusiastic, and people-oriented." },
    { id: "Sanguine-Melancholic", name: "Sanguine-Melancholic", description: "Emotional and expressive, but with a sensitive and thoughtful side." },
    { id: "Sanguine-Phlegmatic", name: "Sanguine-Phlegmatic", description: "Easy-going, happy, and highly adaptable." },

    { id: "Choleric-Sanguine", name: "Choleric-Sanguine", description: "Highly energetic, productive, and charismatic leader." },
    { id: "Choleric-Melancholic", name: "Choleric-Melancholic", description: "Driven, meticulous, and highly focused on results." },
    { id: "Choleric-Phlegmatic", name: "Choleric-Phlegmatic", description: "Determined but calm, efficient, and steady." },

    { id: "Melancholic-Sanguine", name: "Melancholic-Sanguine", description: "Gifted, emotional, and perfectionistic but friendly." },
    { id: "Melancholic-Choleric", name: "Melancholic-Choleric", description: "Deep thinker with a strong will and drive for perfection." },
    { id: "Melancholic-Phlegmatic", name: "Melancholic-Phlegmatic", description: "Quiet, analytical, and very consistent." },

    { id: "Phlegmatic-Sanguine", name: "Phlegmatic-Sanguine", description: "Peaceful, diplomatic, and humorous." },
    { id: "Phlegmatic-Choleric", name: "Phlegmatic-Choleric", description: "Calm but firm, good at management and routine." },
    { id: "Phlegmatic-Melancholic", name: "Phlegmatic-Melancholic", description: "Gentle, thoughtful, and reliable." },
];

export const SOCIONICS_TYPES = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    { id: "ILE", name: "ILE (ENTp) - Don Quixote", description: "Intuitive Logical Extrovert" },
    { id: "SEI", name: "SEI (ISFp) - Dumas", description: "Sensory Ethical Introvert" },
    { id: "ESE", name: "ESE (ESFj) - Hugo", description: "Ethical Sensory Extrovert" },
    { id: "LII", name: "LII (INTj) - Robespierre", description: "Logical Intuitive Introvert" },
    { id: "EIE", name: "EIE (ENFj) - Hamlet", description: "Ethical Intuitive Extrovert" },
    { id: "LSI", name: "LSI (ISTj) - Maxim Gorky", description: "Logical Sensory Introvert" },
    { id: "SLE", name: "SLE (ESTp) - Zhukov", description: "Sensory Logical Extrovert" },
    { id: "IEI", name: "IEI (INFp) - Yesenin", description: "Intuitive Ethical Introvert" },
    { id: "SEE", name: "SEE (ESFp) - Napoleon", description: "Sensory Ethical Extrovert" },
    { id: "ILI", name: "ILI (INTp) - Balzac", description: "Intuitive Logical Introvert" },
    { id: "LIE", name: "LIE (ENTj) - Jack London", description: "Logical Intuitive Extrovert" },
    { id: "ESI", name: "ESI (ISFj) - Dreiser", description: "Ethical Sensory Introvert" },
    { id: "LSE", name: "LSE (ESTj) - Stierlitz", description: "Logical Sensory Extrovert" },
    { id: "EII", name: "EII (INFj) - Dostoevsky", description: "Ethical Intuitive Introvert" },
    { id: "IEE", name: "IEE (ENFp) - Huxley", description: "Intuitive Ethical Extrovert" },
    { id: "SLI", name: "SLI (ISTp) - Gabin", description: "Sensory Logical Introvert" },
];

export const ATTITUDINAL_PSYCHE_TYPES = [
    { id: "unknown", name: "I don't know / Belum Tahu", description: "Select this if you are unsure of your type." },
    { id: "VLEF", name: "VLEF - The Inquisitor", description: "Volition, Logic, Emotion, Physics" },
    { id: "VLFE", name: "VLFE - The Teacher", description: "Volition, Logic, Physics, Emotion" },
    { id: "VELF", name: "VELF - The Herald", description: "Volition, Emotion, Logic, Physics" },
    { id: "VEFL", name: "VEFL - The Orchestrator", description: "Volition, Emotion, Physics, Logic" },
    { id: "VFLE", name: "VFLE - The Firebrand", description: "Volition, Physics, Logic, Emotion" },
    { id: "VFEL", name: "VFEL - The Arbiter", description: "Volition, Physics, Emotion, Logic" },

    { id: "LVEF", name: "LVEF - The Researcher", description: "Logic, Volition, Emotion, Physics" },
    { id: "LVFE", name: "LVFE - The Conductor", description: "Logic, Volition, Physics, Emotion" },
    { id: "LEVF", name: "LEVF - The Visionary", description: "Logic, Emotion, Volition, Physics" },
    { id: "LEFV", name: "LEFV - The Daydreamer", description: "Logic, Emotion, Physics, Volition" },
    { id: "LFVE", name: "LFVE - The Consultant", description: "Logic, Physics, Volition, Emotion" },
    { id: "LFEV", name: "LFEV - The Connoisseur", description: "Logic, Physics, Emotion, Volition" },

    { id: "EVEL", name: "EVEL - The Dramatist", description: "Emotion, Volition, Emotion, Logic (Typo in source? Usually EVLF)" },
    // Let's correct standard AP types
    { id: "EVLF", name: "EVLF - The Catalyst", description: "Emotion, Volition, Logic, Physics" },
    { id: "EVFL", name: "EVFL - The Enthusiast", description: "Emotion, Volition, Physics, Logic" },
    { id: "ELVF", name: "ELVF - The Dramatic", description: "Emotion, Logic, Volition, Physics" },
    { id: "ELFV", name: "ELFV - The Chronicler", description: "Emotion, Logic, Physics, Volition" },
    { id: "EFVL", name: "EFVL - The Decorator", description: "Emotion, Physics, Volition, Logic" },
    { id: "EFLV", name: "EFLV - The Satirist", description: "Emotion, Physics, Logic, Volition" },

    { id: "FVEL", name: "FVEL - The Flourish", description: "Physics, Volition, Emotion, Logic" },
    { id: "FVLE", name: "FVLE - The Patron", description: "Physics, Volition, Logic, Emotion" },
    { id: "FLEV", name: "FLEV - The Alchemist", description: "Physics, Logic, Emotion, Volition" },
    { id: "FLVE", name: "FLVE - The Curio", description: "Physics, Logic, Volition, Emotion" },
    { id: "FEVL", name: "FEVL - The Impressionist", description: "Physics, Emotion, Volition, Logic" },
    { id: "FELV", name: "FELV - The Moodmaker", description: "Physics, Emotion, Logic, Volition" },
];
