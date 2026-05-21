export type TypologyType = {
    system: string;
    code: string;
    name: string;
    description: string;
    mistypeWith: string[];
    corePattern: string;
    distinguishingQuestions: string[];
};

export type TypologyFramework = {
    key: string;
    system: string;
    title: string;
    description: string;
    types: TypologyType[];
};

const questionSet = {
    mbti: [
        "Dalam keputusan besar, apa contoh nyata ketika kamu memilih arah jangka panjang daripada kenyamanan saat ini?",
        "Saat rencana berubah, apakah kamu lebih dulu mencari pola baru, data tambahan, atau dorongan orang lain?",
        "Konflik apa yang paling sering muncul antara cara berpikirmu dan cara orang lain membaca situasi?",
    ],
    enneagram: [
        "Dalam situasi tertekan, apa yang paling kamu lindungi: kompetensi, citra diri, keamanan, kontrol, atau kedamaian?",
        "Apa contoh konkret ketika motivasi batinmu berbeda dari perilaku yang tampak di luar?",
        "Saat dikritik, reaksi otomatis apa yang muncul sebelum kamu sempat menenangkan diri?",
    ],
    socionics: [
        "Dalam interaksi, informasi apa yang paling cepat kamu tangkap tanpa banyak usaha?",
        "Apa jenis tuntutan sosial atau praktis yang paling terasa menguras energi?",
        "Apakah pola relasimu lebih cocok dibaca dari fungsi Socionics daripada kode MBTI yang mirip?",
    ],
    ap: [
        "Area mana yang terasa paling mudah kamu pimpin: kehendak, logika, emosi, atau kebutuhan fisik?",
        "Area mana yang paling sering membuatmu defensif, bingung, atau membutuhkan validasi?",
        "Dalam konflik, apakah kamu menekan arah, argumen, suasana, atau kenyamanan tubuh lebih dulu?",
    ],
    riasec: [
        "Aktivitas kerja apa yang tetap terasa menarik meski tidak sedang dinilai orang lain?",
        "Apakah kamu lebih terdorong oleh pemecahan masalah, ekspresi, membantu orang, persuasi, struktur, atau kerja praktis?",
        "Lingkungan kerja seperti apa yang membuat energimu turun paling cepat?",
    ],
    general: [
        "Apa contoh perilaku berulang yang membuat kode ini terasa cocok untukmu?",
        "Bagian mana dari deskripsi ini yang paling kuat terasa nyata, dan bagian mana yang meragukan?",
        "Tipe pembanding mana yang paling sering membuatmu ragu, dan dari pengalaman apa keraguan itu muncul?",
    ],
};

function type(system: string, code: string, name: string, description: string, mistypeWith: string[], corePattern: string, distinguishingQuestions = questionSet.general): TypologyType {
    return { system, code, name, description, mistypeWith, corePattern, distinguishingQuestions };
}

const mbtiTypes = [
    type("MBTI", "INTJ", "The Strategic Architect", "Pemikir konseptual yang menyusun arah jangka panjang dan sistem keputusan yang terstruktur.", ["INTP", "ENTJ", "INFJ"], "Ni-Te mencari pola masa depan lalu mengujinya lewat strategi yang bisa dijalankan.", questionSet.mbti),
    type("MBTI", "INTP", "The Analytical Inventor", "Eksplorator ide yang membedah asumsi, model, dan kemungkinan logis.", ["INTJ", "ENTP", "ISTP"], "Ti-Ne mencari presisi konsep sebelum mengikat diri pada satu arah.", questionSet.mbti),
    type("MBTI", "ENTJ", "The Strategic Commander", "Pengarah sistem yang cepat mengubah visi menjadi struktur, target, dan eksekusi.", ["INTJ", "ESTJ", "ENTP"], "Te-Ni mengorganisasi sumber daya untuk hasil yang terukur.", questionSet.mbti),
    type("MBTI", "ENTP", "The Pattern Challenger", "Penguji ide yang hidup dari debat, kemungkinan baru, dan pembalikan sudut pandang.", ["INTP", "ENTJ", "ENFP"], "Ne-Ti mengeksplorasi opsi lalu menguji konsistensi internalnya.", questionSet.mbti),
    type("MBTI", "INFJ", "The Insightful Counselor", "Pembaca pola manusia yang menghubungkan makna, arah, dan dampak emosional.", ["INFP", "INTJ", "ENFJ"], "Ni-Fe mencari makna terpadu dan resonansi interpersonal.", questionSet.mbti),
    type("MBTI", "INFP", "The Values Interpreter", "Reflektif, imajinatif, dan sensitif pada keaslian nilai pribadi.", ["INFJ", "ENFP", "ISFP"], "Fi-Ne menilai dunia dari keselarasan nilai dan kemungkinan personal.", questionSet.mbti),
    type("MBTI", "ENFJ", "The Social Catalyst", "Penggerak relasi yang membaca kebutuhan kelompok dan menyusun arah bersama.", ["INFJ", "ESFJ", "ENTJ"], "Fe-Ni mengorkestrasi dinamika sosial menuju visi manusiawi.", questionSet.mbti),
    type("MBTI", "ENFP", "The Possibility Seeker", "Antusias mengeksplorasi makna, relasi, dan peluang baru yang terasa hidup.", ["INFP", "ENTP", "ENFJ"], "Ne-Fi mencari kemungkinan yang selaras dengan nilai dan identitas.", questionSet.mbti),
    type("MBTI", "ISTJ", "The Reliable Steward", "Praktis, teliti, dan mengandalkan pengalaman teruji untuk menjaga stabilitas.", ["ISFJ", "ESTJ", "INTJ"], "Si-Te menata fakta, prosedur, dan kewajiban secara konsisten.", questionSet.mbti),
    type("MBTI", "ISFJ", "The Practical Protector", "Peka pada kebutuhan konkret orang lain dan stabilitas lingkungan dekat.", ["ISTJ", "INFJ", "ESFJ"], "Si-Fe menjaga kontinuitas, perhatian, dan tanggung jawab relasional.", questionSet.mbti),
    type("MBTI", "ESTJ", "The Operational Organizer", "Tegas dalam struktur, aturan kerja, dan efisiensi tanggung jawab.", ["ENTJ", "ISTJ", "ESFJ"], "Te-Si mengatur sistem dengan standar praktis dan pengalaman mapan.", questionSet.mbti),
    type("MBTI", "ESFJ", "The Community Organizer", "Berorientasi harmoni sosial, kewajiban, dan perhatian praktis pada orang lain.", ["ENFJ", "ISFJ", "ESTJ"], "Fe-Si menjaga ritme sosial dan kebutuhan konkret komunitas.", questionSet.mbti),
    type("MBTI", "ISTP", "The Tactical Analyst", "Tenang, observasional, dan cepat memahami mekanisme melalui tindakan langsung.", ["INTP", "ESTP", "ISTJ"], "Ti-Se memecahkan masalah dengan presisi teknis dan respons situasional.", questionSet.mbti),
    type("MBTI", "ISFP", "The Sensory Individualist", "Lembut, mandiri, dan mengekspresikan nilai lewat pengalaman nyata.", ["INFP", "ESFP", "ISTP"], "Fi-Se mengejar keselarasan personal melalui tindakan dan estetika konkret.", questionSet.mbti),
    type("MBTI", "ESTP", "The Adaptive Operator", "Responsif, berani, dan kuat membaca peluang langsung di lapangan.", ["ESFP", "ENTP", "ISTP"], "Se-Ti bertindak cepat lalu menyesuaikan taktik dari umpan balik nyata.", questionSet.mbti),
    type("MBTI", "ESFP", "The Experiential Connector", "Ekspresif, hangat, dan menghidupkan situasi melalui pengalaman bersama.", ["ESTP", "ENFP", "ISFP"], "Se-Fi mencari pengalaman intens yang selaras dengan rasa personal.", questionSet.mbti),
];

const enneagramTypes = [
    ["1w9", "The Idealistic Reformer", "Mengejar kebaikan dan ketepatan dengan gaya lebih tenang dan menahan diri.", ["1w2", "9w1", "5w6"]],
    ["1w2", "The Advocate", "Memperbaiki dunia lewat standar tinggi, tanggung jawab, dan kepedulian aktif.", ["1w9", "2w1", "6w5"]],
    ["2w1", "The Servant", "Mencari kedekatan lewat bantuan yang benar, berguna, dan bertanggung jawab.", ["2w3", "1w2", "6w7"]],
    ["2w3", "The Host", "Mencari koneksi lewat daya tarik sosial, kontribusi, dan pengakuan relasional.", ["2w1", "3w2", "7w6"]],
    ["3w2", "The Charmer", "Berorientasi pencapaian, adaptif, dan ingin terlihat bernilai bagi orang lain.", ["3w4", "2w3", "7w8"]],
    ["3w4", "The Professional", "Mengejar keberhasilan dengan identitas khas, standar tinggi, dan kesan kompeten.", ["3w2", "4w3", "1w2"]],
    ["4w3", "The Aristocrat", "Mengejar identitas unik sambil tetap ingin terlihat menarik dan berhasil.", ["4w5", "3w4", "7w6"]],
    ["4w5", "The Bohemian", "Mendalami identitas, emosi, dan makna dengan jarak reflektif yang kuat.", ["4w3", "5w4", "9w1"]],
    ["5w4", "The Iconoclast", "Menarik diri untuk memahami, menjaga kompetensi, dan mengekspresikan kedalaman personal.", ["5w6", "4w5", "9w1"]],
    ["5w6", "The Problem Solver", "Mencari kompetensi melalui analisis, verifikasi, dan kesiapan menghadapi risiko.", ["5w4", "6w5", "1w9"]],
    ["6w5", "The Defender", "Mencari keamanan melalui analisis, loyalitas selektif, dan skenario cadangan.", ["6w7", "5w6", "1w2"]],
    ["6w7", "The Buddy", "Mengelola kecemasan lewat dukungan sosial, opsi, dan kesiapan praktis.", ["6w5", "7w6", "2w3"]],
    ["7w6", "The Entertainer", "Menghindari keterbatasan lewat opsi, koneksi, dan pengalaman yang menjaga semangat.", ["7w8", "6w7", "2w3"]],
    ["7w8", "The Realist", "Mengejar kebebasan, intensitas, dan peluang dengan dorongan lebih tegas.", ["7w6", "8w7", "3w2"]],
    ["8w7", "The Maverick", "Melindungi otonomi lewat keberanian, intensitas, dan kontrol atas arah.", ["8w9", "7w8", "3w4"]],
    ["8w9", "The Bear", "Kuat, protektif, dan menjaga kontrol dengan gaya lebih stabil dan tenang.", ["8w7", "9w8", "1w9"]],
    ["9w8", "The Referee", "Mencari kedamaian sambil tetap memiliki batas, ketahanan, dan sikap membumi.", ["9w1", "8w9", "6w5"]],
    ["9w1", "The Dreamer", "Mencari harmoni, kesederhanaan, dan kebaikan tanpa konflik yang tajam.", ["9w8", "1w9", "5w4"]],
].map(([code, name, description, mistypes]) =>
    type("Enneagram", code as string, name as string, description as string, mistypes as string[], "Motivasi inti lebih penting daripada perilaku permukaan.", questionSet.enneagram)
);

const instinctualTypes = [
    type("Instinctual Variant", "sp/so", "Self-Preservation Social", "Mengutamakan stabilitas hidup, keamanan sumber daya, lalu posisi sosial.", ["sp/sx", "so/sp", "sx/sp"], "Keamanan pribadi menjadi pintu utama sebelum koneksi sosial."),
    type("Instinctual Variant", "sp/sx", "Self-Preservation Sexual", "Mengutamakan keamanan pribadi dan ikatan intens yang selektif.", ["sp/so", "sx/sp", "so/sx"], "Kenyamanan dan kedalaman relasi lebih penting daripada jangkauan sosial."),
    type("Instinctual Variant", "so/sp", "Social Self-Preservation", "Mengutamakan peran sosial, jaringan, lalu kestabilan praktis.", ["so/sx", "sp/so", "sx/so"], "Membaca posisi dalam kelompok sebelum mengatur kebutuhan pribadi."),
    type("Instinctual Variant", "so/sx", "Social Sexual", "Mengutamakan pengaruh sosial dan chemistry yang membuat relasi terasa hidup.", ["so/sp", "sx/so", "sp/sx"], "Daya tarik sosial dan intensitas koneksi saling memperkuat."),
    type("Instinctual Variant", "sx/sp", "Sexual Self-Preservation", "Mengutamakan intensitas, daya tarik, dan ikatan mendalam dengan stabilitas pribadi.", ["sx/so", "sp/sx", "sp/so"], "Fokus pada chemistry kuat yang tetap butuh rasa aman."),
    type("Instinctual Variant", "sx/so", "Sexual Social", "Mengutamakan intensitas relasi dan pengaruh sosial yang terasa magnetik.", ["sx/sp", "so/sx", "so/sp"], "Koneksi intens menjadi sumber energi untuk tampil di ruang sosial."),
].map((item) => ({ ...item, distinguishingQuestions: questionSet.enneagram }));

const socionicsTypes = [
    ["ILE", "Intuitive Logical Extrovert", "Eksplorator kemungkinan dan model logis yang suka membongkar asumsi.", ["LII", "ENTP MBTI", "IEE"]],
    ["SEI", "Sensory Ethical Introvert", "Peka pada kenyamanan, atmosfer, dan dukungan relasional yang halus.", ["ESI", "ISFP MBTI", "ESE"]],
    ["ESE", "Ethical Sensory Extrovert", "Mengatur suasana sosial dan kebutuhan konkret kelompok secara aktif.", ["SEI", "ESFJ MBTI", "EIE"]],
    ["LII", "Logical Intuitive Introvert", "Menyusun struktur konsep, prinsip, dan konsistensi sistem.", ["ILE", "INTP MBTI", "ILI"]],
    ["EIE", "Ethical Intuitive Extrovert", "Mengarahkan emosi kolektif lewat narasi, visi, dan intensitas makna.", ["IEI", "ENFJ MBTI", "ESE"]],
    ["LSI", "Logical Sensory Introvert", "Menata aturan, batas, dan presisi operasional dengan disiplin.", ["LSE", "ISTJ MBTI", "SLE"]],
    ["SLE", "Sensory Logical Extrovert", "Cepat mengambil ruang, momentum, dan kontrol praktis.", ["LSI", "ESTP MBTI", "LIE"]],
    ["IEI", "Intuitive Ethical Introvert", "Membaca arus waktu, simbol, dan nuansa emosional secara reflektif.", ["EIE", "INFJ MBTI", "ILI"]],
    ["SEE", "Sensory Ethical Extrovert", "Bergerak lewat daya tarik, keberanian sosial, dan peluang langsung.", ["ESI", "ESFP MBTI", "SLE"]],
    ["ILI", "Intuitive Logical Introvert", "Membaca konsekuensi, tren, dan efisiensi dari jarak analitis.", ["LII", "INTJ MBTI", "IEI"]],
    ["LIE", "Logical Intuitive Extrovert", "Mengubah peluang menjadi sistem produktif dan strategi bisnis.", ["ILI", "ENTJ MBTI", "SLE"]],
    ["ESI", "Ethical Sensory Introvert", "Menjaga nilai, batas relasi, dan loyalitas secara tegas.", ["SEI", "ISFJ MBTI", "SEE"]],
    ["LSE", "Logical Sensory Extrovert", "Mengoptimalkan kerja nyata, proses, dan standar kualitas.", ["LSI", "ESTJ MBTI", "LIE"]],
    ["EII", "Ethical Intuitive Introvert", "Memahami nilai personal, empati, dan potensi relasi jangka panjang.", ["IEI", "INFP MBTI", "ESI"]],
    ["IEE", "Intuitive Ethical Extrovert", "Membuka kemungkinan relasi, ide, dan arah personal orang lain.", ["ILE", "ENFP MBTI", "EII"]],
    ["SLI", "Sensory Logical Introvert", "Menguasai kenyamanan, teknik praktis, dan efisiensi tindakan.", ["LSI", "ISTP MBTI", "SEI"]],
].map(([code, name, description, mistypes]) =>
    type("Socionics", code as string, name as string, description as string, mistypes as string[], "Socionics dibaca sebagai sistem terpisah dari MBTI, meski kode populer sering mirip.", questionSet.socionics)
);

const apCodes = ["VLEF", "VLFE", "VELF", "VEFL", "VFLE", "VFEL", "LVEF", "LVFE", "LEVF", "LEFV", "LFVE", "LFEV", "EVLF", "EVFL", "ELVF", "ELFV", "EFVL", "EFLV", "FVEL", "FVLE", "FLEV", "FLVE", "FEVL", "FELV"];
const aspectNames: Record<string, string> = { V: "Volition", L: "Logic", E: "Emotion", F: "Physics" };
const apTypes = apCodes.map((code) => {
    const order = code.split("").map((letter) => aspectNames[letter]).join(" / ");
    const nearby = apCodes.filter((candidate) => candidate !== code && candidate[0] === code[0]).slice(0, 3);
    return type("Attitudinal Psyche", code, `${code} - ${order}`, `Prioritas AP dengan urutan ${order}.`, nearby, `Area pertama biasanya paling tegas; area ketiga sering paling sensitif untuk dicek.`, questionSet.ap);
});

const riasecLabels: Record<string, string> = {
    R: "Realistik",
    I: "Investigatif",
    A: "Artistik",
    S: "Sosial",
    E: "Wirausaha",
    C: "Konvensional",
};
const riasecLetters = Object.keys(riasecLabels);
const riasecCombos = riasecLetters.flatMap((a) =>
    riasecLetters.filter((b) => b !== a).flatMap((b) =>
        riasecLetters.filter((c) => c !== a && c !== b).map((c) => `${a}${b}${c}`)
    )
);
const riasecTypes = riasecCombos.map((code) => {
    const labels = code.split("").map((letter) => riasecLabels[letter]);
    const mistypes = [`${code[0]}${code[2]}${code[1]}`, `${code[1]}${code[0]}${code[2]}`, `${code[0]}${code[1]}${riasecLetters.find((letter) => !code.includes(letter)) ?? "A"}`];
    return type("RIASEC", code, labels.join(" / "), `Pola minat kerja yang menggabungkan ${labels.join(", ")}.`, mistypes, "RIASEC membaca minat lingkungan kerja, bukan kepastian tipe kepribadian.", questionSet.riasec);
});

const bigFiveTypes = [
    ["O-high", "Openness Tinggi", "Terbuka pada ide, estetika, kompleksitas, dan eksplorasi.", ["O-low", "A-high", "N-high"]],
    ["O-low", "Openness Rendah", "Lebih nyaman dengan kejelasan, tradisi, dan pengalaman yang sudah terbukti.", ["O-high", "C-high", "Sensing MBTI"]],
    ["C-high", "Conscientiousness Tinggi", "Terstruktur, disiplin, dan kuat pada tanggung jawab.", ["C-low", "J MBTI", "Type 1"]],
    ["C-low", "Conscientiousness Rendah", "Lebih fleksibel, spontan, dan tidak selalu bergerak lewat struktur kaku.", ["C-high", "P MBTI", "Type 7"]],
    ["E-high", "Extraversion Tinggi", "Mendapat energi dari stimulasi, ekspresi, dan keterlibatan sosial.", ["E-low", "so/sx", "ENFP"]],
    ["E-low", "Extraversion Rendah", "Lebih hemat energi sosial dan reflektif dalam memilih stimulasi.", ["E-high", "Introvert MBTI", "sp/sx"]],
    ["A-high", "Agreeableness Tinggi", "Kooperatif, empatik, dan menjaga kualitas relasi.", ["A-low", "Type 2", "Fe MBTI"]],
    ["A-low", "Agreeableness Rendah", "Lebih blak-blakan, kompetitif, atau fokus pada objektivitas daripada harmoni.", ["A-high", "Type 8", "Te MBTI"]],
    ["N-high", "Neuroticism Tinggi", "Lebih sensitif terhadap ancaman, tekanan, dan fluktuasi emosi.", ["N-low", "Type 6", "4w5"]],
    ["N-low", "Neuroticism Rendah", "Lebih stabil secara emosi dan tidak mudah terdorong oleh kekhawatiran.", ["N-high", "9w8", "8w9"]],
].map(([code, name, description, mistypes]) =>
    type("Big Five", code as string, name as string, description as string, mistypes as string[], "Big Five membaca tingkat sifat, bukan label tipe tetap.")
);

const temperamentBase = [
    ["Sanguine", "Ekspresif, sosial, cepat antusias, dan mudah bergerak mengikuti suasana.", ["Sanguine-Choleric", "Sanguine-Phlegmatic", "ESFP"]],
    ["Choleric", "Tegas, berorientasi hasil, cepat mengambil kendali, dan kompetitif.", ["Choleric-Melancholic", "Choleric-Sanguine", "ENTJ"]],
    ["Melancholic", "Analitis, mendalam, perfeksionis, dan sensitif terhadap kualitas.", ["Melancholic-Choleric", "Melancholic-Phlegmatic", "INTJ"]],
    ["Phlegmatic", "Tenang, stabil, suportif, dan menghindari konflik yang tidak perlu.", ["Phlegmatic-Sanguine", "Phlegmatic-Melancholic", "9w1"]],
];
const blendedTemperaments = temperamentBase.flatMap(([first]) =>
    temperamentBase
        .map(([second]) => second)
        .filter((second) => second !== first)
        .map((second) => [`${first}-${second}`, `${first} dominan dengan warna ${second} sebagai gaya pendukung.`, [`${second}-${first}`, first, second]])
);
const temperamentTypes = [
    ...temperamentBase.map(([code, description, mistypes]) => type("Temperament", code as string, code as string, description as string, mistypes as string[], "Temperamen membaca pola energi dan respons emosi umum.")),
    ...blendedTemperaments.map(([code, description, mistypes]) => type("Temperament", code as string, code as string, description as string, mistypes as string[], "Campuran temperamen dibaca dari pola dominan dan gaya sekunder.")),
];

const hearts = ["2", "3", "4"];
const heads = ["5", "6", "7"];
const guts = ["8", "9", "1"];
const tritypeTypes = hearts.flatMap((heart) =>
    heads.flatMap((head) =>
        guts.map((gut) => {
            const code = `${heart}${head}${gut}`;
            return type("Tritype", code, `Tritype ${code}`, `Gabungan strategi heart ${heart}, head ${head}, dan gut ${gut}.`, [`${heart}${head}${guts[(guts.indexOf(gut) + 1) % guts.length]}`, `${heart}${heads[(heads.indexOf(head) + 1) % heads.length]}${gut}`, `${hearts[(hearts.indexOf(heart) + 1) % hearts.length]}${head}${gut}`], "Tritype membandingkan strategi dominan dari pusat heart, head, dan gut.", questionSet.enneagram);
        })
    )
);

export const typologyFrameworks: TypologyFramework[] = [
    { key: "mbti", system: "MBTI", title: "MBTI", description: "Preferensi kognitif untuk membaca cara mengambil informasi, membuat keputusan, dan mengatur energi.", types: mbtiTypes },
    { key: "enneagram", system: "Enneagram", title: "Enneagram", description: "Lensa motivasi inti, ketakutan, strategi perlindungan diri, dan pola pertumbuhan.", types: enneagramTypes },
    { key: "instinctual-variant", system: "Instinctual Variant", title: "Instinctual Variant", description: "Prioritas instingtual pada keamanan, sosial, atau intensitas koneksi.", types: instinctualTypes },
    { key: "tritype", system: "Tritype", title: "Tritype", description: "Kombinasi strategi dari pusat heart, head, dan gut dalam Enneagram.", types: tritypeTypes },
    { key: "socionics", system: "Socionics", title: "Socionics", description: "Kerangka metabolisme informasi dan relasi antar tipe yang dibaca terpisah dari MBTI.", types: socionicsTypes },
    { key: "attitudinal-psyche", system: "Attitudinal Psyche", title: "Attitudinal Psyche", description: "Urutan sikap terhadap volition, logic, emotion, dan physics.", types: apTypes },
    { key: "riasec", system: "RIASEC", title: "RIASEC", description: "Pola minat kerja dan lingkungan karier yang terasa memberi energi.", types: riasecTypes },
    { key: "big-five", system: "Big Five", title: "Big Five", description: "Dimensi sifat berbasis spektrum: openness, conscientiousness, extraversion, agreeableness, neuroticism.", types: bigFiveTypes },
    { key: "temperament", system: "Temperament", title: "Temperament", description: "Pola energi, respons emosi, dan gaya adaptasi umum.", types: temperamentTypes },
];

export function typologyTypeSlug(code: string) {
    return code.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-");
}

export function getTypologyFramework(system: string) {
    const normalized = system.toLowerCase();
    return typologyFrameworks.find((framework) => framework.key === normalized || framework.system.toLowerCase() === normalized) ?? null;
}

export function getTypologyType(system: string, typeCode: string) {
    const framework = getTypologyFramework(system);
    if (!framework) return null;

    const normalized = typeCode.toLowerCase();
    const found = framework.types.find((item) =>
        item.code.toLowerCase() === normalized || typologyTypeSlug(item.code) === normalized
    );

    return found ? { framework, type: found } : null;
}
