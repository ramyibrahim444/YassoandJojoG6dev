/* ============================================================================
 * generators.js  —  Procedural content engine
 * ----------------------------------------------------------------------------
 * Every generator is a function (rng) => item.
 * Because they use randomised numbers / pools, each one can produce far more
 * than 500 unique questions, so the boys always get FRESH content.
 *
 * Item shapes:
 *   MCQ   -> { q, choices:[...], answer:<index>, explain }
 *   FILL  -> { q, accept:[...normalised strings], answer:<display>, explain }
 * ==========================================================================*/

/* ---- tiny seeded RNG (mulberry32) so a session can be reproducible ---- */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = {
  int:  (rng, lo, hi) => Math.floor(rng() * (hi - lo + 1)) + lo,
  pick: (rng, arr)    => arr[Math.floor(rng() * arr.length)],
  shuffle: (rng, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;

/* Build an MCQ from a correct answer + distractors; shuffles + tracks index */
function mcq(rng, q, correct, distractors, explain) {
  const opts = R.shuffle(rng, [correct, ...distractors]).slice(0, 4);
  if (!opts.includes(correct)) opts[0] = correct;
  const shuffled = R.shuffle(rng, opts.includes(correct) ? opts : [correct, ...distractors].slice(0, 4));
  return { q, choices: shuffled.map(String), answer: shuffled.map(String).indexOf(String(correct)), explain };
}
function fill(q, answer, accept, explain) {
  const norm = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/[.,;!?"']/g, "");
  return { q, answer: String(answer), accept: (accept || [answer]).map(norm), explain, _fill: true, _norm: norm };
}

/* ==========================================================================
 * MATH GENERATORS
 * ========================================================================== */
const GEN = {};

GEN.simplify_fraction = (rng) => {
  const f = R.int(rng, 2, 9), n = R.int(rng, 1, 6), d = R.int(rng, n + 1, 10);
  const N = n * f, D = d * f, g = gcd(N, D);
  const ans = `${N / g}/${D / g}`;
  return mcq(rng, `Simplify the fraction ${N}/${D} to its lowest terms.`, ans,
    [`${N}/${D}`, `${N / g}/${D}`, `${N}/${D / g}`],
    `Divide top and bottom by their highest common factor (${g}): ${N}÷${g}=${N / g}, ${D}÷${g}=${D / g}.`);
};

GEN.frac_to_dec_pct = (rng) => {
  const pairs = [[1,2,0.5,50],[1,4,0.25,25],[3,4,0.75,75],[1,5,0.2,20],[2,5,0.4,40],[3,5,0.6,60],[4,5,0.8,80],[1,10,0.1,10],[3,10,0.3,30],[7,10,0.7,70],[1,20,0.05,5],[1,100,0.01,1],[9,10,0.9,90],[1,25,0.04,4]];
  const [n,d,dec,pct] = R.pick(rng, pairs);
  const mode = R.int(rng, 0, 2);
  if (mode === 0) return mcq(rng, `Write ${n}/${d} as a percentage.`, `${pct}%`, [`${pct+5}%`, `${Math.max(1,pct-10)}%`, `${d}%`], `${n}/${d} = ${dec} = ${pct}%.`);
  if (mode === 1) return mcq(rng, `Write ${pct}% as a decimal.`, `${dec}`, [`${pct}`, `${dec*10}`, `${(dec/10).toFixed(3)}`], `${pct}% means ${pct} per 100 = ${dec}.`);
  return mcq(rng, `Write ${dec} as a percentage.`, `${pct}%`, [`${dec}%`, `${pct*10}%`, `${Math.round(pct/2)}%`], `Multiply the decimal by 100: ${dec} × 100 = ${pct}%.`);
};

GEN.pct_of = (rng) => {
  const pct = R.pick(rng, [10, 20, 25, 50, 5, 40, 75]);
  const whole = R.int(rng, 2, 20) * 10;
  const ans = whole * pct / 100;
  return mcq(rng, `What is ${pct}% of ${whole}?`, ans, [ans + 10, Math.round(ans / 2), whole - ans], `${pct}% of ${whole} = ${pct}/100 × ${whole} = ${ans}.`);
};
GEN.frac_of = (rng) => {
  const d = R.pick(rng, [2, 3, 4, 5, 10]); const n = R.int(rng, 1, d - 1);
  const whole = d * R.int(rng, 2, 12); const ans = whole / d * n;
  return mcq(rng, `What is ${n}/${d} of ${whole}?`, ans, [ans + d, whole / d, whole - ans], `Divide by ${d} then multiply by ${n}: ${whole}÷${d}=${whole/d}, ×${n}=${ans}.`);
};

GEN.add_sub_fraction = (rng) => {
  const d = R.pick(rng, [2, 3, 4, 5, 6, 8, 10]);
  let a = R.int(rng, 1, d - 1), b = R.int(rng, 1, d - 1);
  const op = R.pick(rng, ["+", "-"]);
  if (op === "-" && b > a) [a, b] = [b, a];
  const num = op === "+" ? a + b : a - b;
  const g = gcd(Math.max(1, num), d) || 1;
  const ans = num === 0 ? "0" : `${num / g}/${d / g}`;
  return mcq(rng, `Work out ${a}/${d} ${op} ${b}/${d}. Give your answer in lowest terms.`, ans,
    [`${num}/${d + d}`, `${a}${op}${b}/${d}`, `${num + 1}/${d}`],
    `Same denominator, so ${op} the tops: ${a}${op}${b}=${num}, over ${d}. Then simplify → ${ans}.`);
};

GEN.ratio_simple = (rng) => {
  const f = R.int(rng, 2, 6), a = R.int(rng, 1, 5), b = R.int(rng, 1, 5);
  const A = a * f, B = b * f, g = gcd(A, B);
  return mcq(rng, `Simplify the ratio ${A} : ${B}.`, `${A / g} : ${B / g}`,
    [`${A} : ${B}`, `${A / g} : ${B}`, `${B / g} : ${A / g}`],
    `Divide both parts by their HCF (${g}): ${A}÷${g}=${A / g}, ${B}÷${g}=${B / g}.`);
};

GEN.read_clock = (rng) => {
  const h = R.int(rng, 1, 12), m = R.pick(rng, [0, 5, 10, 15, 20, 30, 40, 45]);
  const add = R.pick(rng, [15, 20, 30, 45, 60, 90]);
  const total = h * 60 + m + add;
  const h2 = Math.floor(total / 60) % 12 || 12, m2 = total % 60;
  const fmt = (H, M) => `${H}:${String(M).padStart(2, "0")}`;
  return mcq(rng, `A clock shows ${fmt(h, m)}. What time is it ${add} minutes later?`, fmt(h2, m2),
    [fmt(h2 + 1 > 12 ? 1 : h2 + 1, m2), fmt(h2, (m2 + 5) % 60), fmt(h, m)],
    `${add} minutes after ${fmt(h, m)} is ${fmt(h2, m2)}.`);
};

GEN.data_mean = (rng) => {
  const n = R.int(rng, 4, 5), data = Array.from({ length: n }, () => R.int(rng, 1, 10));
  const sum = data.reduce((x, y) => x + y, 0);
  while (sum % n !== 0) { data[0] += (n - (sum % n)); break; }
  const s2 = data.reduce((x, y) => x + y, 0), mean = s2 / n;
  return mcq(rng, `Find the MEAN (average) of: ${data.join(", ")}.`, +mean.toFixed(2),
    [+(mean + 1).toFixed(2), s2, +(mean - 1).toFixed(2)],
    `Add them up (${s2}) and divide by how many there are (${n}): ${s2}÷${n}=${(+mean.toFixed(2))}.`);
};
GEN.data_median = (rng) => {
  const n = R.pick(rng, [5, 7]);
  const data = Array.from({ length: n }, () => R.int(rng, 1, 20));
  const sorted = data.slice().sort((a, b) => a - b);
  const med = sorted[(n - 1) / 2];
  return mcq(rng, `Find the MEDIAN (middle value) of: ${data.join(", ")}.`, med,
    [sorted[0], sorted[n - 1], data[0]],
    `Put them in order (${sorted.join(", ")}) and take the middle one: ${med}.`);
};
GEN.data_mode = (rng) => {
  const base = [R.int(rng, 1, 9), R.int(rng, 1, 9)];
  const mode = R.int(rng, 1, 9);
  const data = R.shuffle(rng, [mode, mode, mode, base[0], base[1]]);
  return mcq(rng, `Find the MODE (most common value) of: ${data.join(", ")}.`, mode,
    [base[0], base[1], Math.max(...data)],
    `The mode is the number that appears most often: ${mode}.`);
};
GEN.data_range = (rng) => {
  const data = Array.from({ length: R.int(rng, 4, 6) }, () => R.int(rng, 1, 30));
  const range = Math.max(...data) - Math.min(...data);
  return mcq(rng, `Find the RANGE of: ${data.join(", ")}.`, range,
    [Math.max(...data), Math.min(...data), range + 1],
    `Range = biggest − smallest = ${Math.max(...data)} − ${Math.min(...data)} = ${range}.`);
};

GEN.graph_read = (rng) => {
  const cats = R.shuffle(rng, ["Mon", "Tue", "Wed", "Thu", "Fri"]).slice(0, 4);
  const vals = cats.map(() => R.int(rng, 2, 20));
  const table = cats.map((c, i) => `${c}=${vals[i]}`).join(", ");
  const kind = R.int(rng, 0, 2);
  if (kind === 0) { const i = vals.indexOf(Math.max(...vals)); return mcq(rng, `A bar chart shows: ${table}. Which day had the MOST?`, cats[i], cats.filter((_, k) => k !== i), `The tallest bar is ${cats[i]} with ${vals[i]}.`); }
  if (kind === 1) { const tot = vals.reduce((a, b) => a + b, 0); return mcq(rng, `A bar chart shows: ${table}. What is the TOTAL for all days?`, tot, [tot - vals[0], tot + 2, Math.max(...vals)], `Add every bar: ${vals.join("+")} = ${tot}.`); }
  const d = Math.max(...vals) - Math.min(...vals); return mcq(rng, `A line graph shows: ${table}. What is the DIFFERENCE between the highest and lowest?`, d, [d + 1, Math.max(...vals), Math.min(...vals)], `Highest ${Math.max(...vals)} − lowest ${Math.min(...vals)} = ${d}.`);
};
GEN.bar_compare = (rng) => {
  const a = R.int(rng, 5, 20), b = R.int(rng, 5, 20);
  const A = R.pick(rng, ["apples", "books", "goals", "stars"]), B = R.pick(rng, ["oranges", "pens", "points", "coins"]);
  return mcq(rng, `A chart shows ${a} ${A} and ${b} ${B}. How many MORE ${a >= b ? A : B} than ${a >= b ? B : A}?`, Math.abs(a - b),
    [Math.abs(a - b) + 1, a + b, Math.max(a, b)], `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}.`);
};
GEN.pictogram = (rng) => {
  const each = R.pick(rng, [2, 5, 10]); const symbols = R.int(rng, 2, 6);
  return mcq(rng, `In a pictogram, each ★ stands for ${each}. A row has ${symbols} stars (★). How many does that show?`, each * symbols,
    [each + symbols, each * (symbols + 1), symbols], `${symbols} stars × ${each} each = ${each * symbols}.`);
};

GEN.probability_simple = (rng) => {
  const kind = R.int(rng, 0, 2);
  if (kind === 0) return mcq(rng, `You flip a fair coin. What is the probability of getting Heads?`, "1/2", ["1/4", "1", "2/2"], "A coin has 2 equal sides, 1 is Heads → 1/2.");
  if (kind === 1) { const t = R.int(rng, 1, 6); return mcq(rng, `You roll a fair 6-sided dice. What is the probability of rolling a ${t}?`, "1/6", ["1/2", "6/6", "1/3"], `There are 6 equally likely numbers, only one is ${t} → 1/6.`); }
  const red = R.int(rng, 1, 4), blue = R.int(rng, 1, 4), tot = red + blue, g = gcd(red, tot);
  return mcq(rng, `A bag has ${red} red and ${blue} blue balls. Probability of picking red?`, `${red / g}/${tot / g}`,
    [`${red}/${blue}`, `${blue}/${tot}`, `1/${tot}`], `${red} red out of ${tot} total = ${red}/${tot}${g > 1 ? " = " + red / g + "/" + tot / g : ""}.`);
};

GEN.order_ops = (rng) => {
  const a = R.int(rng, 2, 9), b = R.int(rng, 2, 9), c = R.int(rng, 2, 9);
  const ans = a + b * c;
  return mcq(rng, `Work out: ${a} + ${b} × ${c}`, ans, [(a + b) * c, a + b + c, a * b + c],
    `Do × before +: ${b}×${c}=${b * c}, then +${a} = ${ans}. (BIDMAS)`);
};
GEN.word_problem = (rng) => {
  const each = R.int(rng, 2, 9), boxes = R.int(rng, 3, 12), extra = R.int(rng, 1, 9);
  const ans = each * boxes + extra;
  return mcq(rng, `A shop has ${boxes} boxes with ${each} pens in each, plus ${extra} loose pens. How many pens in total?`, ans,
    [each * boxes, ans + each, boxes + each + extra], `${boxes}×${each}=${each * boxes}, plus ${extra} = ${ans}.`);
};

/* ==========================================================================
 * ENGLISH GENERATORS
 * ========================================================================== */
const NAMES = ["Sam", "Mia", "Omar", "Lena", "Ali", "Nour", "Adam", "Layla", "Karim", "Hana", "Zara", "Yusuf", "Dina", "Tarek", "Salma", "Rami", "Jana", "Khaled", "Maya", "Fares"];
const PLACES = ["the park", "school", "the beach", "the market", "her room", "the garden", "the museum", "the library", "the cinema", "the zoo", "the stadium", "the bakery", "the harbour"];
const VERBS = ["went to", "walked to", "ran to", "cycled to", "hurried to", "returned from", "came back from"];
const OBJECTS = ["a book", "an apple", "the ball", "a new bag", "some flowers", "a kite", "her homework", "the map", "a puzzle", "two tickets"];

GEN.punctuation_capital = (rng) => {
  const name = R.pick(rng, NAMES), verb = R.pick(rng, VERBS), place = R.pick(rng, PLACES);
  const correct = `${name} ${verb} ${place}.`;
  return mcq(rng, "Which sentence is written correctly?", correct,
    [`${name.toLowerCase()} ${verb} ${place}.`, `${name} ${verb} ${place}`, `${name} ${verb.replace(/\b\w/g, c => c.toUpperCase())} ${place}.`],
    "Start with a capital letter, use a capital for the name, and end with a full stop.");
};
GEN.end_punctuation = (rng) => {
  const name = R.pick(rng, NAMES), place = R.pick(rng, PLACES), obj = R.pick(rng, OBJECTS);
  const templates = [
    { s: `What time does ${name} arrive`, a: "?" },
    { s: `Look out, ${name}`, a: "!" },
    { s: `${name} likes ${obj}`, a: "." },
    { s: `How did ${name} get to ${place}`, a: "?" },
    { s: `That was an amazing goal, ${name}`, a: "!" },
    { s: `The bus to ${place} is late`, a: "." },
    { s: `Where did ${name} put ${obj}`, a: "?" },
    { s: `We finally reached ${place}`, a: "!" },
    { s: `${name} reads ${obj} every night`, a: "." },
    { s: `Why is ${name} at ${place}`, a: "?" }
  ];
  const p = R.pick(rng, templates);
  return mcq(rng, `Which punctuation mark best ends this sentence?  "${p.s} __"`, p.a, [".", "?", "!"].filter(x => x !== p.a).concat(p.a).filter((v, i, a) => a.indexOf(v) === i),
    p.a === "?" ? "It is a question, so use a question mark." : p.a === "!" ? "It shows strong feeling, so use an exclamation mark." : "It is a normal statement, so use a full stop.");
};
GEN.comma_use = (rng) => {
  const banks = [["apples", "pears", "bananas", "grapes", "mangoes"], ["red", "green", "blue", "yellow", "purple"],
  ["cats", "dogs", "birds", "fish", "rabbits"], ["maths", "English", "science", "art", "history"],
  ["Cairo", "Rome", "Paris", "Tokyo", "Madrid"], ["pens", "rulers", "pencils", "erasers", "books"]];
  const bank = R.pick(rng, banks);
  const three = R.shuffle(rng, bank).slice(0, 3);
  const correct = `I like ${three[0]}, ${three[1]} and ${three[2]}.`;
  return mcq(rng, "Which sentence uses commas correctly in a list?", correct,
    [`I like ${three[0]} ${three[1]} and ${three[2]}.`, `I like ${three[0]},${three[1]},${three[2]}.`, `I like, ${three[0]} ${three[1]} ${three[2]}.`],
    "Use commas to separate items in a list, with 'and' before the last item.");
};
GEN.tense_agree = (rng) => {
  const name = R.pick(rng, NAMES), place = R.pick(rng, PLACES), obj = R.pick(rng, OBJECTS);
  const set = [
    { s: `Yesterday ${name} ___ to ${place}.`, a: "walked", d: ["walks", "walking", "walk"] },
    { s: `Right now they ___ football.`, a: "are playing", d: ["played", "plays", "play"] },
    { s: `Tomorrow we ___ ${place}.`, a: "will visit", d: ["visited", "visits", "visiting"] },
    { s: `Last week ${name} ___ ${obj}.`, a: "found", d: ["finds", "finding", "will find"] },
    { s: `Every morning ${name} ___ breakfast.`, a: "eats", d: ["ate", "eaten", "eating"] },
    { s: `An hour ago the rain ___ .`, a: "stopped", d: ["stops", "stopping", "will stop"] },
    { s: `Next year ${name} ___ a new school.`, a: "will start", d: ["started", "starts", "starting"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word:  "${p.s}"`, p.a, p.d, `The time word tells you the tense. Correct: "${p.a}".`);
};
GEN.subject_verb = (rng) => {
  const name = R.pick(rng, NAMES);
  const set = [
    { s: `The dog ___ every morning.`, a: "barks", d: ["bark", "barking", "barked"] },
    { s: `My friends ___ to music.`, a: "listen", d: ["listens", "listening", "listens to"] },
    { s: `${name} ___ her homework.`, a: "does", d: ["do", "doing", "done"] },
    { s: `The children ___ happy.`, a: "are", d: ["is", "am", "be"] },
    { s: `${name} and Omar ___ to school together.`, a: "walk", d: ["walks", "walking", "walked"] },
    { s: `Each of the boys ___ a bag.`, a: "has", d: ["have", "having", "haves"] },
    { s: `There ___ many books on the shelf.`, a: "are", d: ["is", "was", "be"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the word that agrees with the subject:  "${p.s}"`, p.a, p.d, `Correct: "${p.a}" agrees with the subject.`);
};
GEN.spelling_choose = (rng) => {
  const words = [["because","becuase","becouse"],["friend","freind","frend"],["beautiful","beutiful","beautifull"],
  ["separate","seperate","seprate"],["necessary","neccessary","necesary"],["believe","beleive","belive"],
  ["favourite","faverite","favorit"],["different","diffrent","diferent"],["tomorrow","tommorow","tomorow"],
  ["remember","remeber","rememeber"],["Wednesday","Wenesday","Wendsday"],["experience","experiance","experence"],
  ["surprise","suprise","surprize"],["knowledge","knowlege","knoledge"],["definitely","definately","definitly"],
  ["environment","enviroment","enviorment"],["restaurant","restaraunt","resturant"],["February","Febuary","Februrary"],
  ["address","adress","addres"],["business","buisness","bussiness"],["calendar","calender","calandar"],
  ["cemetery","cemetary","cematery"],["conscience","conscence","concience"],["embarrass","embarass","embaras"],
  ["grammar","grammer","gramar"],["independent","independant","independet"],["library","libary","libry"],
  ["maintenance","maintainance","maintanence"],["occasion","ocasion","occassion"],["parliament","parliment","parlaiment"],
  ["possession","posession","possesion"],["privilege","priviledge","privelege"],["recommend","recomend","reccommend"],
  ["rhythm","rythm","rhythem"],["sincerely","sincerley","sincerly"],["successful","succesful","successfull"],
  ["tomato","tomatoe","tomatто"],["until","untill","untl"],["vegetable","vegatable","vegetible"],["weird","wierd","weard"],
  ["accommodate","acommodate","accomodate"],["achieve","acheive","acheeve"],["aggressive","agressive","aggresive"],
  ["apparent","apparant","aparent"],["appearance","appearence","apperance"],["argument","arguement","arguemnt"],
  ["athlete","athelete","athlate"],["autumn","autum","autunm"],["beginning","begining","beggining"],
  ["breathe","breath","breeth"],["build","biuld","buld"],["caught","cauhgt","cought"],["choose","chose","chooze"],
  ["column","colum","collumn"],["coming","comming","cominng"],["committee","commitee","comittee"],
  ["completely","completly","compleatly"],["daughter","dauhter","doughter"],["decide","descide","deside"],
  ["disappear","dissapear","disapear"],["disappoint","dissapoint","disapoint"],["eighth","eigth","eightth"],
  ["exercise","excercise","exersize"],["familiar","familer","fimiliar"],["finally","finaly","finnally"],
  ["foreign","foriegn","forein"],["forty","fourty","fortey"],["guard","gaurd","gard"],["happened","happend","happenned"],
  ["height","hieght","heighth"],["interesting","intresting","interesting"],["island","iland","islnd"],
  ["jewellery","jewelery","jewlery"],["language","langauge","languge"],["length","lenght","lenth"],
  ["lightning","lightening","litning"],["meant","ment","meent"],["medicine","medecine","medicin"],
  ["minute","minit","minnute"],["neighbour","nieghbour","neighbor"],["ninety","ninty","nintey"],
  ["occurred","occured","ocurred"],["opposite","opposit","oposite"],["particular","particuler","paticular"],
  ["people","peaple","peeple"],["persuade","persuade","pursuade"],["pieces","peices","peaces"],
  ["potatoes","potatos","potatoe"],["preferred","prefered","preffered"],["probably","probly","probabley"],
  ["promise","promiss","promisse"],["queue","que","queeue"],["really","realy","reallly"],["receive","recieve","receeve"],
  ["rhyme","ryme","rhime"],["scissors","sissors","scisors"],["secretary","secratary","secretery"],
  ["sentence","sentance","sentense"],["signature","signiture","signeture"],["special","speshal","speical"],
  ["stomach","stomache","stomac"],["straight","straght","stright"],["strength","strenght","strengh"],
  ["temperature","temprature","temperture"],["therefore","therefor","theirfore"],["thought","thougt","thaught"],
  ["through","throuh","thru"],["together","togeter","togather"],["tongue","tounge","tung"],["truly","truely","trully"],
  ["unfortunately","unfortunatly","unforunately"],["usually","usualy","usaully"],["various","varius","vairous"],
  ["woman","womin","womam"],["women","wimen","wommen"],["writing","writting","writeing"],["yacht","yatch","yaht"],
  ["absence","absense","abscence"],["actually","actualy","actualley"],["although","allthough","altho"],
  ["amateur","amatuer","amature"],["ancient","anceint","antient"],["answer","anser","answ"],["appreciate","apreciate","appriciate"],
  ["arctic","artic","arktic"],["available","availabe","avaliable"],["awkward","akward","awkwerd"],["balance","balence","ballance"],
  ["bargain","bargin","bargane"],["basically","basicly","basicaly"],["beautifully","beutifully","beautifuly"],
  ["beginner","begginer","beginer"],["believe","beleeve","belive"],["benefit","benifit","benfit"],["bicycle","bycicle","bicicle"],
  ["biscuit","bisquit","biscit"],["bruise","bruse","bruize"],["career","carreer","carear"],["ceiling","cieling","celing"],
  ["certain","certin","certian"],["character","caracter","charecter"],["colleague","collegue","coleague"],
  ["convenient","convienient","conveniant"],["courage","curage","courage"],["curiosity","curiousity","curiosety"],
  ["decision","desicion","decission"],["describe","discribe","describ"],["desperate","desparate","desperete"],
  ["develop","develope","devlop"],["disease","desease","disees"],["divide","devide","divid"],["dictionary","dictionery","dictonary"],
  ["earliest","earlyest","earlest"],["eighth","eightth","eith"],["either","iether","eather"],["enough","enuff","enouhg"],
  ["especially","especialy","expecially"],["exaggerate","exagerate","exaggarate"],["excellent","excelent","exellent"],
  ["existence","existance","existense"],["explanation","explaination","explanaton"],["extreme","extreem","extream"],
  ["fascinate","facinate","fascenate"],["forward","foward","forwerd"],["fourteen","forteen","fourten"],
  ["frequently","frequestly","frequenly"],["generally","generaly","genrally"],["genius","genious","genuis"],
  ["government","goverment","governmet"],["gradually","gradualy","graduelly"],["guarantee","garantee","guarentee"],
  ["harass","harrass","haras"],["honest","onest","honnest"],["humorous","humourous","humerous"],["hygiene","hygene","hygeine"],
  ["identity","idenity","identety"],["imaginary","imaginery","imaginry"],["immediately","imediately","immediatly"],
  ["important","importent","importint"],["instead","insted","intsead"],["intelligent","inteligent","intelligant"],
  ["interrupt","interupt","interrpt"],["jealous","jelous","jealuos"],["journey","journy","jorney"],["knowledge","knowlege","knollege"],
  ["laboratory","labratory","laberatory"],["leisure","liesure","leasure"],["lonely","lonly","loanly"],["marriage","marraige","mariage"],
  ["material","matereal","matirial"],["mathematics","mathmatics","mathematcs"],["millennium","millenium","milennium"],
  ["miniature","miniture","minature"],["mischievous","mischevious","mischievious"],["muscle","mussle","muscel"],
  ["mysterious","mysterous","misterious"],["naughty","naughtey","nauhgty"],["noticeable","noticable","noticeble"],
  ["obvious","obvius","obvous"],["occurrence","occurance","occurence"],["original","orignal","origional"],
  ["parallel","paralel","parrallel"],["patient","pacient","patiant"],["peculiar","peculier","pecular"],["persuade","persaude","perswade"],
  ["physical","fysical","physcal"],["pleasant","plesant","pleasent"],["possible","posible","possable"],["preferred","prefered","preffered"],
  ["prejudice","predjudice","prejadice"],["pronunciation","pronounciation","pronuncation"],["quarter","quater","quartar"],
  ["queue","kew","queu"],["recognise","reconise","recognize"],["reference","referance","refrence"],["relevant","relevent","revelant"],
  ["religious","religous","reliigous"],["responsible","responsable","responsibe"],["rhythm","rhythem","rythm"],
  ["sandwich","sandwhich","sanwich"],["schedule","schedual","shedule"],["science","sceince","sience"],["scissors","sisors","scizzors"],
  ["secondary","secandary","secondery"],["separate","seperete","separete"],["serious","serous","seriuos"],
  ["similar","similer","simmilar"],["sincerely","sinceerly","sincerley"],["soldier","solder","soljer"],["special","speciel","speshial"],
  ["strength","strenth","strenght"],["success","sucess","succes"],["suddenly","sudenly","suddenley"],["suggest","sugest","suggeest"],
  ["surprise","supprise","surprize"],["symbol","simbol","symble"],["technique","techneque","technic"],["thorough","thorogh","thurough"],
  ["throughout","throughot","thruout"],["tomorrow","tommorrow","tomorrow"],["tongue","toungue","tounge"],["twelfth","twelth","twelvth"],
  ["unusual","unusaul","unusuall"],["vehicle","vehical","vehicel"],["view","veiw","vew"],["village","villige","vilage"],
  ["weather","wether","weater"],["Wednesday","Wednsday","Wenesday"],["weight","wieght","weght"],["whether","wether","whther"]];
  const w = R.pick(rng, words);
  return mcq(rng, "Which spelling is CORRECT?", w[0], [w[1], w[2]], `The correct spelling is "${w[0]}".`);
};
GEN.homophone = (rng) => {
  const set = [
    { s: "I can't find ___ shoes.", a: "their", d: ["there", "they're"] },
    { s: "___ going to be sunny.", a: "It's", d: ["Its", "Its'"] },
    { s: "Put the book over ___.", a: "there", d: ["their", "they're"] },
    { s: "The dog wagged ___ tail.", a: "its", d: ["it's", "its'"] },
    { s: "You ___ my best friend.", a: "are", d: ["our", "hour"] },
    { s: "We ate ___ than usual.", a: "more", d: ["moor", "mour"] },
    { s: "I would like ___ apples.", a: "two", d: ["to", "too"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word:  "${p.s}"`, p.a, p.d, `Correct homophone: "${p.a}".`);
};
GEN.plural_form = (rng) => {
  const set = [["baby", "babies"], ["box", "boxes"], ["child", "children"], ["leaf", "leaves"], ["mouse", "mice"], ["city", "cities"], ["knife", "knives"], ["foot", "feet"], ["tomato", "tomatoes"], ["person", "people"]];
  const p = R.pick(rng, set);
  const wrong = [p[0] + "s", p[0] + "es", p[1] + "s"].filter(x => x !== p[1]);
  return mcq(rng, `What is the correct plural of "${p[0]}"?`, p[1], wrong, `The plural of "${p[0]}" is "${p[1]}".`);
};
GEN.apostrophe = (rng) => {
  const set = [
    { s: "This is ___ ball. (belonging to Sam)", a: "Sam's", d: ["Sams", "Sams'"] },
    { s: "The ___ toys are new. (more than one child)", a: "children's", d: ["childrens", "childrens'"] },
    { s: "___ raining outside.", a: "It's", d: ["Its", "Its'"] },
    { s: "The two ___ tails wagged. (more than one dog)", a: "dogs'", d: ["dog's", "dogs"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word:  "${p.s}"`, p.a, p.d, `Correct: "${p.a}".`);
};
GEN.vocab_synonym = (rng) => {
  const set = [["happy","joyful",["sad","tired"]],["big","large",["tiny","slow"]],["fast","quick",["heavy","quiet"]],
  ["cold","chilly",["warm","bright"]],["smart","clever",["lazy","loud"]],["scared","afraid",["brave","calm"]],
  ["begin","start",["finish","stop"]],["tired","sleepy",["awake","hungry"]],["small","little",["huge","tall"]],
  ["angry","furious",["gentle","glad"]],["pretty","lovely",["ugly","plain"]],["easy","simple",["hard","tricky"]],
  ["strange","odd",["normal","usual"]],["shout","yell",["whisper","murmur"]],["hard","difficult",["soft","light"]],
  ["rich","wealthy",["poor","broke"]],["kind","caring",["cruel","mean"]],["brave","courageous",["timid","fearful"]],
  ["funny","amusing",["boring","dull"]],["tasty","delicious",["bland","sour"]],["bright","shiny",["dark","dim"]],
  ["quiet","silent",["noisy","loud"]],["strong","powerful",["weak","feeble"]],["old","ancient",["new","modern"]],
  ["choose","select",["reject","refuse"]],["make","create",["destroy","break"]],["look","glance",["ignore","miss"]],
  ["jump","leap",["crawl","sit"]],["giant","enormous",["minute","small"]],["wet","damp",["dry","arid"]],
  ["glad","pleased",["upset","annoyed"]],["famous","well-known",["unknown","hidden"]],["neat","tidy",["messy","untidy"]],
  ["ask","enquire",["answer","reply"]],["hurry","rush",["dawdle","delay"]],["end","finish",["begin","open"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Which word means the SAME as "${p[0]}" (a synonym)?`, p[1], p[2], `"${p[1]}" means the same as "${p[0]}".`);
};
GEN.vocab_antonym = (rng) => {
  const set = [["hot","cold",["warm","boiling"]],["up","down",["high","top"]],["happy","sad",["glad","cheerful"]],
  ["fast","slow",["quick","speedy"]],["big","small",["huge","large"]],["open","closed",["ajar","wide"]],
  ["day","night",["morning","noon"]],["full","empty",["packed","loaded"]],["light","dark",["bright","shiny"]],
  ["true","false",["real","correct"]],["begin","end",["start","open"]],["love","hate",["like","adore"]],
  ["win","lose",["score","play"]],["push","pull",["shove","press"]],["clean","dirty",["neat","tidy"]],
  ["rich","poor",["wealthy","grand"]],["brave","cowardly",["bold","heroic"]],["easy","hard",["simple","plain"]],
  ["wet","dry",["damp","soggy"]],["young","old",["new","fresh"]],["loud","quiet",["noisy","booming"]],
  ["tall","short",["high","long"]],["early","late",["prompt","soon"]],["strong","weak",["mighty","tough"]],
  ["buy","sell",["pay","spend"]],["give","take",["offer","hand"]],["remember","forget",["recall","memorise"]],
  ["accept","reject",["agree","allow"]],["increase","decrease",["grow","rise"]],["arrive","leave",["reach","enter"]],
  ["ancient","modern",["old","aged"]],["polite","rude",["kind","gentle"]],["shrink","grow",["reduce","lessen"]],
  ["gather","scatter",["collect","group"]],["appear","disappear",["show","emerge"]],["float","sink",["drift","rise"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Which word is the OPPOSITE of "${p[0]}" (an antonym)?`, p[1], p[2], `The opposite of "${p[0]}" is "${p[1]}".`);
};
GEN.sentence_order = (rng) => {
  const stories = [
    ["First, I woke up early.", "Then I ate breakfast.", "Finally, I went to school."],
    ["First, we planted the seed.", "Next, we watered it every day.", "At last, a flower grew."],
    ["First, she mixed the flour.", "Then she baked the cake.", "Finally, everyone ate it."],
    ["First, the sky turned dark.", "Then it started to rain.", "Finally, a rainbow appeared."]
  ];
  const s = R.pick(rng, stories);
  const correct = "1, 2, 3";
  const labelled = s.map((x, i) => `(${i + 1}) ${x}`).join("  ");
  return mcq(rng, `Put these in the best order:  ${R.shuffle(rng, s).map((x) => x).join("  /  ")}\n\nWhich order makes sense?`, correct,
    ["3, 2, 1", "2, 1, 3", "1, 3, 2"], "Order the events by time words: First → Then/Next → Finally. Correct sequence: " + s.join(" "));
};
GEN.creative_prompt = (rng) => {
  const chars = ["a curious cat", "a brave young explorer", "a friendly robot", "a talking tree", "a lost puppy", "a magical pencil", "a tiny dragon", "a clever detective"];
  const settings = ["a hidden island", "a busy city at night", "a spooky old castle", "the bottom of the ocean", "a faraway planet", "a snowy mountain", "a secret garden"];
  const twists = ["when the lights suddenly go out", "and discovers a mysterious door", "who finds a map to treasure", "and must solve a riddle", "when everything starts to float", "who makes a surprising new friend"];
  return { project: true,
    q: `Write a short story about ${R.pick(rng, chars)} in ${R.pick(rng, settings)}, ${R.pick(rng, twists)}.`,
    checklist: ["A clear beginning, middle and end", "Capital letters and full stops", "At least one paragraph break", "One interesting describing word (adjective)", "Read it back and fix mistakes"] };
};
GEN.review_prompt = (rng) => {
  const things = ["a book you have read", "a film you watched", "a game you played", "a place you visited", "your favourite meal"];
  return { project: true,
    q: `Write a short review of ${R.pick(rng, things)}. Give your OPINION and at least TWO reasons why.`,
    checklist: ["Say what it is", "Give your opinion (did you like it?)", "Give TWO reasons with 'because'", "A star rating out of 5", "Check your punctuation"] };
};

/* ==========================================================================
 * SCIENCE GENERATORS
 * ========================================================================== */
GEN.life_processes = (rng) => {
  const seven = ["Movement", "Respiration", "Sensitivity", "Growth", "Reproduction", "Excretion", "Nutrition"];
  const notProc = ["Photography", "Sleeping", "Talking", "Cooking", "Reading", "Painting"];
  if (rng() < 0.5) {
    const p = R.pick(rng, seven);
    return mcq(rng, `Is "${p}" one of the 7 life processes (MRS GREN)?`, "Yes, it is a life process", ["No, it is not"], `${p} is one of the 7 life processes all living things do.`);
  }
  const bad = R.pick(rng, notProc);
  return mcq(rng, `Which of these is NOT one of the 7 life processes?`, bad, R.shuffle(rng, seven).slice(0, 3),
    `The 7 life processes are Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition (MRS GREN). "${bad}" is not one.`);
};
GEN.mrs_gren_letter = (rng) => {
  const map = { M: "Movement", R: "Respiration", S: "Sensitivity", G: "Growth", R2: "Reproduction", E: "Excretion", N: "Nutrition" };
  const items = [["M", "Movement"], ["R", "Respiration"], ["S", "Sensitivity"], ["G", "Growth"], ["R", "Reproduction"], ["E", "Excretion"], ["N", "Nutrition"]];
  const p = R.pick(rng, items);
  const others = items.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `In "MRS GREN", what does the life process "${p[1]}" mean?  Pick its correct description.`,
    p[1], R.shuffle(rng, others).slice(0, 3),
    descLife(p[1]));
};
function descLife(w) {
  const d = { Movement: "Living things can move parts of their body.", Respiration: "Releasing energy from food (not just breathing).", Sensitivity: "Detecting and responding to the surroundings.", Growth: "Getting bigger and developing.", Reproduction: "Making more of their own kind.", Excretion: "Removing waste products from the body.", Nutrition: "Taking in food/nutrients for energy." };
  return d[w] || "";
}
GEN.food_chain = (rng) => {
  const chains = [["grass","rabbit","fox"],["leaf","caterpillar","bird"],["algae","small fish","big fish"],
  ["seeds","mouse","owl"],["grass","zebra","lion"],["plankton","shrimp","whale"],["clover","insect","frog"],
  ["berries","squirrel","hawk"],["wheat","locust","lizard"],["nectar","bee","spider"],["grass","grasshopper","snake"],
  ["seaweed","crab","seagull"]];
  const c = R.pick(rng, chains);
  const kind = R.int(rng, 0, 3);
  if (kind === 0) return mcq(rng, `In the food chain ${c[0]} → ${c[1]} → ${c[2]}, which is the PRODUCER?`, c[0], [c[1], c[2]], `The producer makes its own food using sunlight — here it is "${c[0]}".`);
  if (kind === 1) return mcq(rng, `In the food chain ${c[0]} → ${c[1]} → ${c[2]}, which is the TOP PREDATOR?`, c[2], [c[0], c[1]], `The top predator eats others and isn't eaten — here it is "${c[2]}".`);
  if (kind === 2) return mcq(rng, `In ${c[0]} → ${c[1]} → ${c[2]}, what does the ARROW mean?`, "Energy passes this way (is eaten by)", ["Runs away from", "Is the same as", "Lives near"], "Arrows in a food chain show energy flowing from the food to the eater.");
  return mcq(rng, `In the food chain ${c[0]} → ${c[1]} → ${c[2]}, which is a PRIMARY CONSUMER (eats the producer)?`, c[1], [c[0], c[2]], `The primary consumer eats the producer — here "${c[1]}" eats "${c[0]}".`);
};
GEN.ecosystem_roles = (rng) => {
  const set = [["A plant that makes its own food","Producer"],["An animal that eats only plants","Herbivore"],
  ["An animal that eats only meat","Carnivore"],["An animal that eats both plants and meat","Omnivore"],
  ["An animal that hunts others","Predator"],["An animal that is hunted","Prey"],
  ["A living thing that breaks down dead matter","Decomposer"],["Everything living in one place","Community"],
  ["The place where an animal lives","Habitat"],["An animal active mainly at night","Nocturnal"]];
  const p = R.pick(rng, set);
  const others = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `What do we call: ${p[0]}?`, p[1], R.shuffle(rng, others).slice(0, 3), `That is a "${p[1]}".`);
};
GEN.body_systems = (rng) => {
  const set = [["heart","Circulatory system"],["lungs","Respiratory system"],["stomach","Digestive system"],
  ["brain","Nervous system"],["bones","Skeletal system"],["muscles","Muscular system"],["kidneys","Excretory system"],
  ["intestines","Digestive system"],["spinal cord","Nervous system"],["blood vessels","Circulatory system"],
  ["skin","Skin (integumentary) system"],["windpipe (trachea)","Respiratory system"],["skull","Skeletal system"],
  ["bladder","Excretory system"]];
  const p = R.pick(rng, set);
  const systems = [...new Set(set.map(x => x[1]))];
  if (rng() < 0.5) {
    const others = systems.filter(x => x !== p[1]);
    return mcq(rng, `The ${p[0]} is part of which body system?`, p[1], R.shuffle(rng, others).slice(0, 3), `The ${p[0]} belongs to the ${p[1]}.`);
  }
  const inSys = set.filter(x => x[1] === p[1]).map(x => x[0]);
  const notInSys = set.filter(x => x[1] !== p[1]).map(x => x[0]);
  const right = R.pick(rng, inSys);
  return mcq(rng, `Which organ belongs to the ${p[1]}?`, right, R.shuffle(rng, notInSys).slice(0, 3), `The ${right} is part of the ${p[1]}.`);
};
GEN.solar_system = (rng) => {
  const planets = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  const facts = [
    ["Which is the LARGEST planet in our solar system?", "Jupiter", ["Earth", "Saturn", "Mars"], "Jupiter is the biggest planet."],
    ["Which is the SMALLEST planet?", "Mercury", ["Mars", "Earth", "Pluto"], "Mercury is the smallest planet."],
    ["Which planet is closest to the Sun?", "Mercury", ["Venus", "Earth", "Neptune"], "Mercury is nearest the Sun."],
    ["Which planet is furthest from the Sun?", "Neptune", ["Uranus", "Saturn", "Pluto"], "Neptune is the furthest planet."],
    ["Which planet is famous for its rings?", "Saturn", ["Mars", "Venus", "Earth"], "Saturn has bright, wide rings."],
    ["Which planet is known as the Red Planet?", "Mars", ["Jupiter", "Venus", "Mercury"], "Mars looks red because of iron dust."],
    ["Which planet do we live on?", "Earth", ["Mars", "Venus", "Saturn"], "We live on Earth, the third planet."],
    ["What orbits the Earth?", "The Moon", ["The Sun", "Mars", "Jupiter"], "The Moon orbits Earth."],
    ["What is at the centre of our solar system?", "The Sun", ["The Earth", "The Moon", "Jupiter"], "The Sun is a star at the centre; planets orbit it."],
    ["What causes day and night on Earth?", "Earth spinning on its axis", ["The Sun moving", "The Moon", "Clouds"], "Earth rotates once a day, giving day and night."]
  ];
  if (rng() < 0.5) { const i = R.int(rng, 0, 7); return mcq(rng, `Which planet is number ${i + 1} from the Sun?`, planets[i], R.shuffle(rng, planets.filter((_, k) => k !== i)).slice(0, 3), `Counting from the Sun: ${planets.join(", ")}. Number ${i + 1} is ${planets[i]}.`); }
  const f = R.pick(rng, facts);
  return mcq(rng, f[0], f[1], f[2], f[3]);
};
GEN.fair_test = (rng) => {
  const exps = [
    { q: "You test if plants grow taller with more water. What should you CHANGE?", a: "The amount of water", d: ["The type of pot", "The starting height", "The room"] },
    { q: "You test if a car rolls further on a steeper ramp. What should you KEEP THE SAME?", a: "The same car each time", d: ["The steepness of the ramp", "How far it rolls", "The ramp angle"] },
    { q: "You test which material keeps water warmest. The thing you change is called the...", a: "Independent variable (the one you change)", d: ["Result", "Fair test", "Prediction"] },
    { q: "To make a test FAIR you should change...", a: "Only ONE thing at a time", d: ["Everything at once", "Nothing", "Two things"] },
    { q: "You test how sugar amount affects taste. What do you MEASURE (the result)?", a: "How sweet it tastes", d: ["The amount of sugar", "The cup size", "The water"] },
    { q: "The things you keep the same in an experiment are called...", a: "Control variables", d: ["Results", "Predictions", "Conclusions"] },
    { q: "You test if warmer water dissolves salt faster. What should you CHANGE?", a: "The water temperature", d: ["The amount of salt", "The stirring", "The cup"] },
    { q: "Why do we repeat an experiment several times?", a: "To make the results more reliable", d: ["To use more time", "To change the answer", "To skip measuring"] },
    { q: "You test which paper plane flies furthest. What should you KEEP THE SAME?", a: "How hard you throw it", d: ["The plane design", "The distance flown", "The paper shape"] }
  ];
  const p = R.pick(rng, exps);
  return mcq(rng, p.q, p.a, p.d, "A fair test changes ONE thing (independent variable) and keeps everything else the same (control variables).");
};
GEN.scientific_method = (rng) => {
  const steps = [
    { q: "What comes FIRST when planning an investigation?", a: "Ask a question", d: ["Write the conclusion", "Collect results", "Draw a graph"] },
    { q: "A sensible guess about what will happen is called a...", a: "Prediction", d: ["Conclusion", "Result", "Method"] },
    { q: "Where do you record the numbers you measure?", a: "In a results table", d: ["In the question", "In the prediction", "Nowhere"] },
    { q: "The sentence explaining what your results show is the...", a: "Conclusion", d: ["Prediction", "Question", "Apparatus"] },
    { q: "Finish the sentence: 'The plant grew taller ___ it had more light.'", a: "because", d: ["but", "although", "however"] },
    { q: "Finish the sentence: 'The ice melted faster in the sun ___ it was warmer.'", a: "because", d: ["so", "but", "unless"] },
    { q: "What is a good way to show your results clearly?", a: "Draw a graph or chart", d: ["Hide them", "Only say them", "Guess them"] },
    { q: "A prediction often uses the words...", a: "'I think… will…'", d: ["'The end'", "'Once upon a time'", "'In conclusion'"] },
    { q: "If your results don't match your prediction, you should...", a: "Report them honestly and try to explain why", d: ["Change the numbers", "Ignore them", "Start again secretly"] },
    { q: "The equipment you use in an experiment is called the...", a: "Apparatus", d: ["Conclusion", "Variable", "Prediction"] }
  ];
  const p = R.pick(rng, steps);
  return mcq(rng, p.q, p.a, p.d, `Correct: "${p.a}". Good scientists explain results using 'because…'.`);
};
GEN.circuits = (rng) => {
  const set = [
    { q: "What do you need to make a bulb light up?", a: "A complete (closed) circuit", d: ["An open circuit", "Only a wire", "Only a bulb"] },
    { q: "Which material lets electricity flow (a conductor)?", a: "Metal", d: ["Plastic", "Wood", "Rubber"] },
    { q: "Which material does NOT let electricity flow (an insulator)?", a: "Plastic", d: ["Copper", "Iron", "Steel"] },
    { q: "What does a switch do in a circuit?", a: "Opens or closes the circuit", d: ["Stores energy", "Makes light", "Adds water"] },
    { q: "A magnet attracts objects made of...", a: "Iron/steel", d: ["Plastic", "Paper", "Glass"] },
    { q: "What provides the energy in a simple circuit?", a: "The battery (cell)", d: ["The wire", "The switch", "The bulb"] },
    { q: "If you add more cells (batteries), the bulb usually gets...", a: "Brighter", d: ["Dimmer", "Colder", "Bigger"] },
    { q: "What happens if there is a break (gap) in the circuit?", a: "The bulb goes out", d: ["The bulb gets brighter", "Nothing changes", "The wire melts"] },
    { q: "Which of these is a good conductor of electricity?", a: "Copper wire", d: ["Wooden ruler", "Plastic straw", "Glass cup"] },
    { q: "The two ends (poles) of a magnet are called...", a: "North and South", d: ["Left and Right", "Hot and Cold", "Plus and Minus only"] },
    { q: "Why do wires have a plastic coating?", a: "Plastic is an insulator and keeps us safe", d: ["To make them heavy", "To conduct more", "For decoration only"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

/* ---- extra high-variety SCIENCE scenario generators ------------------- */
GEN.fair_test_scenario = (rng) => {
  const exps = [
    { change: "the amount of water", measure: "how tall the plant grows", keeps: ["the same pot", "the same soil", "the same type of plant", "the same amount of light"] },
    { change: "the amount of sunlight", measure: "how green the leaves are", keeps: ["the same water", "the same pot", "the same soil", "the same plant"] },
    { change: "the type of material", measure: "how warm the water stays", keeps: ["the same amount of water", "the same starting temperature", "the same cup size", "the same room"] },
    { change: "the steepness of the ramp", measure: "how far the car rolls", keeps: ["the same car", "the same floor", "the same starting push", "the same ramp length"] },
    { change: "the amount of sugar", measure: "how sweet the drink tastes", keeps: ["the same water", "the same cup", "the same temperature", "the same stirring"] },
    { change: "the water temperature", measure: "how fast the salt dissolves", keeps: ["the same amount of salt", "the same stirring", "the same cup", "the same amount of water"] },
    { change: "the thickness of the string", measure: "how much weight it can hold", keeps: ["the same string length", "the same knot", "the same weights", "the same hook"] },
    { change: "the length of the pendulum", measure: "how many swings in 10 seconds", keeps: ["the same weight", "the same push", "the same start height", "the same timer"] },
    { change: "the surface (carpet, tile, grass)", measure: "how far the ball rolls", keeps: ["the same ball", "the same push", "the same slope", "the same start point"] },
    { change: "the brand of paper towel", measure: "how much water it soaks up", keeps: ["the same paper size", "the same water", "the same soak time", "the same bowl"] },
    { change: "the amount of fertiliser", measure: "how many leaves grow", keeps: ["the same water", "the same light", "the same soil", "the same seed"] },
    { change: "the shape of the paper plane", measure: "how far it flies", keeps: ["the same paper", "the same throw", "the same launch height", "the same room"] },
    { change: "the number of batteries", measure: "how bright the bulb is", keeps: ["the same bulb", "the same wires", "the same switch", "the same circuit"] },
    { change: "the colour of the cup", measure: "how quickly the water cools", keeps: ["the same water", "the same cup size", "the same start temperature", "the same room"] }
  ];
  const e = R.pick(rng, exps);
  const kind = R.int(rng, 0, 2);
  if (kind === 0)
    return mcq(rng, `An experiment measures ${e.measure} for different amounts of ${e.change.replace(/^the /, "")}. What is the ONE thing you should CHANGE?`,
      e.change, [R.pick(rng, e.keeps), e.measure, R.pick(rng, e.keeps)], "Change only the independent variable — here, " + e.change + ".");
  if (kind === 1)
    return mcq(rng, `You change ${e.change} and want a fair test. What should you MEASURE (the result)?`,
      e.measure, R.shuffle(rng, e.keeps).slice(0, 3), "You measure the outcome — here, " + e.measure + ".");
  const keep = R.pick(rng, e.keeps);
  return mcq(rng, `You are changing ${e.change}. Which of these should you KEEP THE SAME?`,
    keep, [e.change, e.measure, R.pick(rng, e.keeps.filter(k => k !== keep))], "Keep everything else the same (control variables) — for example, " + keep + ".");
};

GEN.life_process_scenario = (rng) => {
  const acts = [
    ["A cat runs across the garden", "Movement"], ["A plant turns to face the sunlight", "Sensitivity"],
    ["A seed grows into a tall tree", "Growth"], ["A bird lays eggs", "Reproduction"],
    ["Your body releases energy from food", "Respiration"], ["A person breathes out and sweats to remove waste", "Excretion"],
    ["A dog eats its dinner", "Nutrition"], ["A rabbit hops away from a fox", "Movement"],
    ["A baby grows bigger every year", "Growth"], ["A flower makes seeds", "Reproduction"],
    ["You pull your hand away from something hot", "Sensitivity"], ["A fish takes in food", "Nutrition"],
    ["Leaves turn towards the light", "Sensitivity"], ["Cells release energy from sugar", "Respiration"],
    ["The kidneys remove waste from the blood", "Excretion"], ["A tadpole becomes a frog", "Growth"],
    ["A worm wriggles through the soil", "Movement"], ["A cat's pupils get smaller in bright light", "Sensitivity"],
    ["A hen hatches chicks", "Reproduction"], ["A cow chews grass to get nutrients", "Nutrition"],
    ["A kitten grows into a cat", "Growth"], ["You breathe out carbon dioxide as waste", "Excretion"],
    ["A snail glides along a leaf", "Movement"], ["A spider spins a web to catch food", "Nutrition"],
    ["Plants release energy from glucose in their cells", "Respiration"], ["A sunflower follows the Sun across the sky", "Sensitivity"],
    ["A tree drops seeds that grow into new trees", "Reproduction"], ["A frog's legs get longer as it develops", "Growth"]
  ];
  const p = R.pick(rng, acts);
  const all = ["Movement", "Respiration", "Sensitivity", "Growth", "Reproduction", "Excretion", "Nutrition"];
  return mcq(rng, `Which life process is shown here?  "${p[0]}"`, p[1], R.shuffle(rng, all.filter(x => x !== p[1])).slice(0, 3), `${p[0]} — this is ${p[1]}.`);
};

GEN.biology_facts = (rng) => {
  const set = [
    { q: "Which part of a plant takes in water from the soil?", a: "Roots", d: ["Leaves", "Flower", "Petal"] },
    { q: "Which part of a plant makes food using sunlight?", a: "Leaves", d: ["Roots", "Stem", "Seed"] },
    { q: "What is the job of the flower on a plant?", a: "To make seeds (reproduction)", d: ["To take in water", "To make food", "To hold the plant up"] },
    { q: "Which gas do plants take in to make food (photosynthesis)?", a: "Carbon dioxide", d: ["Oxygen", "Nitrogen", "Helium"] },
    { q: "Which gas do humans need to breathe in to live?", a: "Oxygen", d: ["Carbon dioxide", "Hydrogen", "Helium"] },
    { q: "How many senses do humans have?", a: "Five", d: ["Three", "Seven", "Ten"] },
    { q: "Which sense organ do you use to see?", a: "Eyes", d: ["Ears", "Nose", "Skin"] },
    { q: "Animals with a backbone are called...", a: "Vertebrates", d: ["Invertebrates", "Mammals only", "Insects"] },
    { q: "A group of animals that have fur and feed milk to their young are...", a: "Mammals", d: ["Reptiles", "Birds", "Fish"] },
    { q: "Which food group gives us the most energy for running?", a: "Carbohydrates", d: ["Vitamins", "Water", "Fibre"] },
    { q: "Which food helps build and repair muscles?", a: "Protein", d: ["Sugar", "Fat", "Salt"] },
    { q: "What do we call teeth that are sharp for tearing food?", a: "Canines", d: ["Molars", "Incisors", "Wisdom"] },
    { q: "The place where a plant or animal lives is its...", a: "Habitat", d: ["Predator", "Producer", "Diet"] },
    { q: "Butterflies change shape as they grow. This is called...", a: "Metamorphosis", d: ["Digestion", "Respiration", "Pollination"] },
    { q: "Bees moving pollen between flowers is called...", a: "Pollination", d: ["Germination", "Excretion", "Migration"] },
    { q: "A seed starting to grow is called...", a: "Germination", d: ["Pollination", "Respiration", "Reproduction"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.space_physics_facts = (rng) => {
  const set = [
    { q: "What force pulls objects towards the Earth?", a: "Gravity", d: ["Magnetism", "Friction", "Electricity"] },
    { q: "The Moon does not make its own light. It...", a: "Reflects the Sun's light", d: ["Is a star", "Makes fire", "Is a planet"] },
    { q: "About how long does the Earth take to orbit the Sun once?", a: "One year", d: ["One day", "One month", "One week"] },
    { q: "About how long does the Earth take to spin once on its axis?", a: "One day (24 hours)", d: ["One year", "One month", "One hour"] },
    { q: "The Sun is actually a...", a: "Star", d: ["Planet", "Moon", "Comet"] },
    { q: "Which force slows a ball rolling on the ground?", a: "Friction", d: ["Gravity upwards", "Magnetism", "Light"] },
    { q: "A shadow forms when an object blocks...", a: "Light", d: ["Sound", "Water", "Air"] },
    { q: "Why do we have seasons?", a: "The Earth is tilted as it orbits the Sun", d: ["The Sun moves closer", "The Moon blocks it", "Clouds change"] },
    { q: "What do we call a rocky object orbiting the Sun, smaller than a planet?", a: "An asteroid", d: ["A galaxy", "A star", "A comet's tail"] },
    { q: "Sound travels as...", a: "Vibrations", d: ["Light rays", "Heat only", "Magnets"] },
    { q: "Which travels faster?", a: "Light travels faster than sound", d: ["Sound is faster", "They are equal", "Neither moves"] },
    { q: "A push or a pull is called a...", a: "Force", d: ["Mass", "Volume", "Length"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.homophone = (rng) => {
  const name = R.pick(rng, NAMES);
  const set = [
    { s: `${name} can't find ___ shoes.`, a: "their", d: ["there", "they're"] },
    { s: "___ going to be sunny today.", a: "It's", d: ["Its", "Its'"] },
    { s: `Put the book over ___, ${name}.`, a: "there", d: ["their", "they're"] },
    { s: "The dog wagged ___ tail.", a: "its", d: ["it's", "its'"] },
    { s: `${name}, you ___ my best friend.`, a: "are", d: ["our", "hour"] },
    { s: "We ate ___ than usual.", a: "more", d: ["moor", "mour"] },
    { s: `${name} would like ___ apples, please.`, a: "two", d: ["to", "too"] },
    { s: `I want to come ___ !`, a: "too", d: ["to", "two"] },
    { s: `${name} walked ___ the shop.`, a: "to", d: ["too", "two"] },
    { s: "The wind ___ the leaves away.", a: "blew", d: ["blue", "bleu"] },
    { s: `${name} ___ the answer straight away.`, a: "knew", d: ["new", "gnu"] },
    { s: "Please write it down over ___ .", a: "here", d: ["hear", "heir"] },
    { s: `Can you ___ the music?`, a: "hear", d: ["here", "heir"] },
    { s: `${name} ate the ___ piece of cake.`, a: "whole", d: ["hole", "wholl"] },
    { s: `They're going ___ way.`, a: "their", d: ["there", "they're"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word:  "${p.s}"`, p.a, p.d, `Correct homophone: "${p.a}".`);
};

GEN.apostrophe = (rng) => {
  const name = R.pick(rng, NAMES);
  const set = [
    { s: `This is ___ ball. (belonging to ${name})`, a: `${name}'s`, d: [`${name}s`, `${name}s'`] },
    { s: "The ___ toys are new. (more than one child)", a: "children's", d: ["childrens", "childrens'"] },
    { s: "___ raining outside.", a: "It's", d: ["Its", "Its'"] },
    { s: "The two ___ tails wagged. (more than one dog)", a: "dogs'", d: ["dog's", "dogs"] },
    { s: `That is ${name} and ___ project. (belonging to both, more than one girl)`, a: "the girls'", d: ["the girl's", "the girls"] },
    { s: "I ___ know the answer.", a: "don't", d: ["dont", "do'nt"] },
    { s: "We ___ be late.", a: "won't", d: ["wont", "wo'nt"] },
    { s: `The ___ wheel was flat. (one car)`, a: "car's", d: ["cars", "cars'"] },
    { s: "The ___ nests are high up. (more than one bird)", a: "birds'", d: ["bird's", "birds"] },
    { s: "___ your turn now.", a: "It's", d: ["Its", "Its'"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word:  "${p.s}"`, p.a, p.d, `Correct: "${p.a}".`);
};

/* ==========================================================================
 * GRADE 6 (ICSE) — harder generators
 * ========================================================================== */
/* Build a numeric MCQ with guaranteed-unique distractors (never equal to the
 * correct answer). Pads with correct±k if the candidate list is too small. */
function mcqNum(rng, q, correct, cands, explain) {
  const seen = new Set([correct]);
  const d = [];
  for (const c of (cands || [])) { if (Number.isFinite(c) && !seen.has(c)) { seen.add(c); d.push(c); } }
  let k = 1;
  while (d.length < 3) { const cand = correct + (k % 2 ? k : -k); k++; if (!seen.has(cand)) { seen.add(cand); d.push(cand); } if (k > 50) break; }
  return mcq(rng, q, correct, d.slice(0, 3), explain);
}

/* ---- MATHS (grade 6) -------------------------------------------------- */
GEN.integers = (rng) => {
  const a = R.int(rng, -15, 15), b = R.int(rng, 1, 15);
  const op = R.pick(rng, ["+", "-", "×"]);
  let ans, expl;
  if (op === "+") { const bb = R.pick(rng, [b, -b]); ans = a + bb; return mcqNum(rng, `Work out:  (${a}) + (${bb})`, ans, [a - bb, -ans, ans + 2, ans - 2], `Add on the number line: ${a} + (${bb}) = ${ans}.`); }
  if (op === "-") { const bb = R.pick(rng, [b, -b]); ans = a - bb; return mcqNum(rng, `Work out:  (${a}) − (${bb})`, ans, [a + bb, -ans, ans + 2, ans - 1], `Subtracting: ${a} − (${bb}) = ${ans}. (Subtracting a negative adds.)`); }
  const bb = R.pick(rng, [b, -b]); ans = a * bb; return mcqNum(rng, `Work out:  (${a}) × (${bb})`, ans, [-ans, a + bb, ans + a, ans - b], `Signs: same → +, different → −. ${a} × (${bb}) = ${ans}.`);
};

GEN.order_ops_hard = (rng) => {
  const a = R.int(rng, 2, 9), b = R.int(rng, 2, 9), c = R.int(rng, 2, 6), d = R.int(rng, 2, 9);
  const t = R.int(rng, 0, 2);
  if (t === 0) { const ans = (a + b) * c - d; return mcqNum(rng, `Work out:  (${a} + ${b}) × ${c} − ${d}`, ans, [a + b * c - d, (a + b) * (c - d), a + b * c, ans + c], `Brackets first: ${a}+${b}=${a + b}; ×${c}=${(a + b) * c}; −${d}=${ans}. (BODMAS)`); }
  if (t === 1) { const ans = a + b * c - d; return mcqNum(rng, `Work out:  ${a} + ${b} × ${c} − ${d}`, ans, [(a + b) * c - d, a + b * (c - d), a + b + c - d, ans + 1], `× before + and −: ${b}×${c}=${b * c}; ${a}+${b * c}−${d}=${ans}.`); }
  const ans = a + c * c - b; return mcqNum(rng, `Work out:  ${a} + ${c}² − ${b}`, ans, [a + c * 2 - b, (a + c) * c - b, a + c * c, ans - 2], `Powers first: ${c}²=${c * c}; ${a}+${c * c}−${b}=${ans}.`);
};

GEN.algebra_eval = (rng) => {
  const m = R.int(rng, 2, 9), x = R.int(rng, 2, 10), c = R.int(rng, 1, 15), op = R.pick(rng, ["+", "-"]);
  const ans = op === "+" ? m * x + c : m * x - c;
  return mcqNum(rng, `If x = ${x}, find the value of  ${m}x ${op} ${c}.`, ans, [m + x + c, op === "+" ? m * x - c : m * x + c, m * (x + c), ans + m], `${m}x = ${m}×${x} = ${m * x}; then ${m * x} ${op} ${c} = ${ans}.`);
};

GEN.algebra_solve = (rng) => {
  const x = R.int(rng, 2, 12), m = R.int(rng, 2, 9), c = R.int(rng, 1, 20), rhs = m * x + c;
  return mcqNum(rng, `Solve for x:   ${m}x + ${c} = ${rhs}`, x, [x + 1, x - 1, rhs - c, x + 2], `Subtract ${c} from both sides: ${m}x = ${rhs - c}. Divide by ${m}: x = ${x}.`);
};

GEN.hcf_lcm = (rng) => {
  const a = R.int(rng, 2, 12), b = R.int(rng, 2, 12), g = gcd(a, b), l = a * b / g;
  if (rng() < 0.5) return mcqNum(rng, `Find the HCF (highest common factor) of ${a} and ${b}.`, g, [l, a * b, Math.min(a, b), g + 1], `The largest number dividing both ${a} and ${b} is ${g}.`);
  return mcqNum(rng, `Find the LCM (lowest common multiple) of ${a} and ${b}.`, l, [g, a + b, a * b, l + a], `The smallest number both ${a} and ${b} go into is ${l}.`);
};

GEN.mensuration = (rng) => {
  const l = R.int(rng, 3, 15), w = R.int(rng, 2, 12), h = R.int(rng, 1, 5) * 2, b = R.int(rng, 4, 16);
  const t = R.int(rng, 0, 3);
  if (t === 0) { const ans = 2 * (l + w); return mcqNum(rng, `A rectangle is ${l} cm by ${w} cm. Find its PERIMETER.`, ans, [l * w, l + w, 2 * l + w, ans + 2], `Perimeter = 2×(l+w) = 2×(${l}+${w}) = ${ans} cm.`); }
  if (t === 1) { const ans = l * w; return mcqNum(rng, `A rectangle is ${l} cm by ${w} cm. Find its AREA.`, ans, [2 * (l + w), l + w, l * w + l, ans + w], `Area = l×w = ${l}×${w} = ${ans} cm².`); }
  if (t === 2) { const ans = b * h / 2; return mcqNum(rng, `A triangle has base ${b} cm and height ${h} cm. Find its AREA.`, ans, [b * h, b + h, ans + b, ans + 1], `Area = ½×base×height = ½×${b}×${h} = ${ans} cm².`); }
  const ans = l * w * h; return mcqNum(rng, `A cuboid is ${l} cm × ${w} cm × ${h} cm. Find its VOLUME.`, ans, [2 * (l * w + w * h + l * h), l + w + h, l * w, ans + l], `Volume = l×w×h = ${l}×${w}×${h} = ${ans} cm³.`);
};

GEN.percentage = (rng) => {
  const k = R.int(rng, 3, 15), whole = 20 * k, pct = R.pick(rng, [5, 10, 15, 20, 25, 40, 50, 75]);
  const part = whole * pct / 100, t = R.int(rng, 0, 2);
  if (t === 0) return mcqNum(rng, `Find ${pct}% of ${whole}.`, part, [whole - pct, part + pct, part / 2, whole * pct / 1000], `${pct}% of ${whole} = ${pct}/100 × ${whole} = ${part}.`);
  if (t === 1) { const ans = whole + part; return mcqNum(rng, `A price of ${whole} increases by ${pct}%. What is the new amount?`, ans, [whole - part, part, ans + pct, whole + pct], `Increase = ${part}. New = ${whole} + ${part} = ${ans}.`); }
  const ans = whole - part; return mcqNum(rng, `A price of ${whole} is reduced by ${pct}%. What is the sale price?`, ans, [whole + part, part, ans - pct, whole - pct], `Discount = ${part}. Sale price = ${whole} − ${part} = ${ans}.`);
};

GEN.ratio_share = (rng) => {
  const a = R.int(rng, 1, 5), b = R.int(rng, 1, 5), part = R.int(rng, 2, 9), total = (a + b) * part, share = a * part;
  return mcqNum(rng, `Share ${total} sweets between two friends in the ratio ${a} : ${b}. How many does the FIRST friend get?`, share, [b * part, total - share, share + part, share - part], `Parts = ${a}+${b}=${a + b}. One part = ${total}÷${a + b}=${part}. First = ${a}×${part}=${share}.`);
};

GEN.decimal_ops = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const a = R.int(rng, 11, 99) / 10, b = R.int(rng, 11, 99) / 10, ans = +(a + b).toFixed(1); return mcqNum(rng, `Work out:  ${a} + ${b}`, ans, [+(a - b).toFixed(1), +(a * b).toFixed(1), +(ans + 1).toFixed(1), +(ans - 0.2).toFixed(1)], `Line up the decimal points: ${a} + ${b} = ${ans}.`); }
  if (t === 1) { const a = R.int(rng, 11, 99) / 10, n = R.int(rng, 2, 9), ans = +(a * n).toFixed(1); return mcqNum(rng, `Work out:  ${a} × ${n}`, ans, [+(a + n).toFixed(1), +(ans + 1).toFixed(1), +(a * n / 10).toFixed(2), +(ans - 0.3).toFixed(1)], `${a} × ${n} = ${ans}.`); }
  const ans = R.int(rng, 11, 60) / 10, n = R.int(rng, 2, 6), a = +(ans * n).toFixed(1); return mcqNum(rng, `Work out:  ${a} ÷ ${n}`, ans, [+(a - n).toFixed(1), +(ans + 0.5).toFixed(1), +(ans - 0.4).toFixed(1), +(a / (n + 1)).toFixed(2)], `${a} ÷ ${n} = ${ans}.`);
};

GEN.data_mean_hard = (rng) => {
  const n = R.int(rng, 4, 6), data = Array.from({ length: n }, () => R.int(rng, 10, 60));
  const sum = data.reduce((x, y) => x + y, 0), mean = +(sum / n).toFixed(2);
  return mcqNum(rng, `Find the MEAN (average) of:  ${data.join(", ")}.`, mean, [+(mean + 2).toFixed(2), sum, +(mean - 3).toFixed(2), Math.max(...data)], `Add them (${sum}) and divide by ${n}: ${sum}÷${n}=${mean}.`);
};

GEN.prob_fraction = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const r = R.int(rng, 2, 6), b = R.int(rng, 2, 6), gn = R.int(rng, 2, 6), tot = r + b + gn, g = gcd(r, tot); return mcq(rng, `A bag has ${r} red, ${b} blue and ${gn} green counters. Probability of picking RED (lowest terms)?`, `${r / g}/${tot / g}`, [`${r}/${b + gn}`, `${b}/${tot}`, `${r + 1}/${tot}`], `P(red) = ${r}/${tot}${g > 1 ? " = " + (r / g) + "/" + (tot / g) : ""}.`); }
  if (t === 1) return mcq(rng, `A fair 6-sided dice is rolled. What is the probability of an EVEN number?`, "1/2", ["1/6", "1/3", "2/3"], "Even numbers 2, 4, 6 → 3 out of 6 = 1/2.");
  const face = R.int(rng, 1, 6); return mcq(rng, `A fair dice is rolled. What is the probability of NOT getting a ${face}?`, "5/6", ["1/6", "4/6", "1/2"], `5 of the 6 outcomes are 'not ${face}' → 5/6.`);
};

GEN.angles = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const a = R.int(rng, 20, 150), ans = 180 - a; return mcqNum(rng, `Two angles sit on a straight line. One is ${a}°. Find the other.`, ans, [360 - a, 90 - a, ans + 10, ans - 10], `Angles on a straight line add to 180°: 180 − ${a} = ${ans}°.`); }
  if (t === 1) { const a = R.int(rng, 30, 100), bb = R.int(rng, 20, 140 - a), ans = 180 - a - bb; return mcqNum(rng, `A triangle has angles ${a}° and ${bb}°. Find the third angle.`, ans, [180 - a, a + bb, ans + 10, 90], `Angles in a triangle add to 180°: 180 − ${a} − ${bb} = ${ans}°.`); }
  const arr = [["less than 90°", "Acute"], ["exactly 90°", "Right"], ["between 90° and 180°", "Obtuse"], ["more than 180°", "Reflex"]]; const p = R.pick(rng, arr);
  return mcq(rng, `An angle that is ${p[0]} is called a(n)...`, p[1], ["Acute", "Right", "Obtuse", "Reflex", "Straight"].filter(x => x !== p[1]).slice(0, 3), `An angle ${p[0]} is ${p[1].toLowerCase()}.`);
};

GEN.time_hard = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const h = R.int(rng, 13, 23), m = R.pick(rng, [0, 15, 30, 45]), h12 = h - 12, mm = String(m).padStart(2, "0"); return mcq(rng, `Write ${h}:${mm} (24-hour clock) as a 12-hour time.`, `${h12}:${mm} pm`, [`${h}:${mm} am`, `${h12}:${mm} am`, `${h12 + 1}:${mm} pm`], `After 12:00 subtract 12: ${h}−12=${h12}, and it is pm.`); }
  if (t === 1) { const h1 = R.int(rng, 1, 4), m1 = R.pick(rng, [0, 10, 20, 30, 40]), dur = R.int(rng, 1, 3) * 60 + R.pick(rng, [10, 20, 25, 40, 45]), end = h1 * 60 + m1 + dur, H = Math.floor(end / 60), M = end % 60, mm1 = String(m1).padStart(2, "0"), MM = String(M).padStart(2, "0"); return mcq(rng, `A film starts at ${h1}:${mm1} and lasts ${Math.floor(dur / 60)} h ${dur % 60} min. What time does it end?`, `${H}:${MM}`, [`${H + 1}:${MM}`, `${H}:${String((M + 15) % 60).padStart(2, "0")}`, `${h1 + Math.floor(dur / 60)}:${mm1}`], `Add ${Math.floor(dur / 60)} h ${dur % 60} min → ${H}:${MM}.`); }
  const h = R.int(rng, 2, 10); return mcqNum(rng, `How many minutes are there in ${h} hours?`, h * 60, [h * 100, h * 30, h * 60 + 10, h * 6], `1 hour = 60 minutes, so ${h} × 60 = ${h * 60}.`);
};

/* ---- ENGLISH (grade 6) ------------------------------------------------ */
GEN.active_passive = (rng) => {
  const set = [["The cat chased the mouse.", "The mouse was chased by the cat."], ["Sam ate the cake.", "The cake was eaten by Sam."], ["The teacher marked the books.", "The books were marked by the teacher."], ["Workers built the bridge.", "The bridge was built by the workers."], ["The dog bit the man.", "The man was bitten by the dog."], ["Lena wrote a letter.", "A letter was written by Lena."], ["The wind broke the window.", "The window was broken by the wind."], ["The chef cooked the meal.", "The meal was cooked by the chef."]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Change this sentence to the PASSIVE voice:  "${p[0]}"`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `Passive = object first + 'was/were' + past participle + 'by'. → "${p[1]}"`);
};

GEN.direct_indirect = (rng) => {
  const set = [[`She said, "I am tired."`, `She said that she was tired.`], [`He said, "I like mangoes."`, `He said that he liked mangoes.`], [`They said, "We will come."`, `They said that they would come.`], [`Sam said, "I can swim."`, `Sam said that he could swim.`], [`Mia said, "I have finished."`, `Mia said that she had finished.`], [`He said, "I am reading now."`, `He said that he was reading then.`]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Choose the correct INDIRECT (reported) speech:   ${p[0]}`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `In reported speech the tense shifts back and pronouns change. → ${p[1]}`);
};

GEN.degrees_comparison = (rng) => {
  const set = [["good", "better", "best"], ["bad", "worse", "worst"], ["big", "bigger", "biggest"], ["happy", "happier", "happiest"], ["far", "farther", "farthest"], ["many", "more", "most"], ["beautiful", "more beautiful", "most beautiful"], ["easy", "easier", "easiest"], ["hot", "hotter", "hottest"], ["little", "less", "least"]];
  const p = R.pick(rng, set), which = R.int(rng, 1, 2), label = which === 1 ? "COMPARATIVE (comparing two)" : "SUPERLATIVE (comparing three or more)", ans = p[which];
  const wrongs = [p[which === 1 ? 2 : 1], p[0], p[0] + (which === 1 ? "est" : "er")].filter(x => x !== ans);
  return mcq(rng, `Give the ${label} form of "${p[0]}".`, ans, wrongs.slice(0, 3), `"${p[0]}" → comparative "${p[1]}", superlative "${p[2]}". Answer: "${ans}".`);
};

GEN.articles = (rng) => {
  const set = [["___ apple", "an"], ["___ hour", "an"], ["___ university", "a"], ["___ honest man", "an"], ["___ European country", "a"], ["___ umbrella", "an"], ["___ one-way street", "a"], ["___ orange", "an"], ["___ house", "a"], ["___ igloo", "an"]];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct article:  "${p[0]}"`, p[1], ["a", "an", "the", "some"].filter(x => x !== p[1]).slice(0, 3), `Use 'an' before a vowel SOUND, 'a' before a consonant sound: "${p[1]}${p[0].slice(3)}".`);
};

GEN.parts_of_speech = (rng) => {
  const set = [["quickly", "Adverb"], ["beautiful", "Adjective"], ["run", "Verb"], ["happiness", "Noun"], ["they", "Pronoun"], ["under", "Preposition"], ["and", "Conjunction"], ["loudly", "Adverb"], ["clever", "Adjective"], ["London", "Noun"], ["she", "Pronoun"], ["jump", "Verb"], ["but", "Conjunction"], ["on", "Preposition"], ["wow", "Interjection"], ["gently", "Adverb"], ["ancient", "Adjective"], ["freedom", "Noun"]];
  const p = R.pick(rng, set), all = ["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition", "Conjunction", "Interjection"];
  return mcq(rng, `What part of speech is the word "${p[0]}"?`, p[1], R.shuffle(rng, all.filter(x => x !== p[1])).slice(0, 3), `"${p[0]}" is a ${p[1].toLowerCase()}.`);
};

GEN.tense_hard = (rng) => {
  const name = R.pick(rng, NAMES);
  const set = [
    { s: `By the time we arrived, the film ___ already started.`, a: "had", d: ["has", "was", "have"] },
    { s: `${name} ___ here since nine o'clock.`, a: "has been waiting", d: ["is waiting", "waited", "waits"] },
    { s: `They ___ dinner when the phone rang.`, a: "were having", d: ["have had", "has", "are having"] },
    { s: `I ___ my homework before I went out.`, a: "had finished", d: ["have finish", "finishes", "am finishing"] },
    { s: `She ___ in Paris for three years now.`, a: "has lived", d: ["is living since", "lived ago", "live"] },
    { s: `Look! It ___ started to rain.`, a: "has", d: ["had", "was", "will"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct verb form:  "${p.s}"`, p.a, p.d, `Correct: "${p.a}".`);
};

GEN.punctuation_hard = (rng) => {
  const set = [
    { q: "Which sentence is punctuated correctly?", a: `"Where are you going?" she asked.`, d: [`"Where are you going." she asked.`, `"where are you going?" she asked.`, `"Where are you going"? she asked.`] },
    { q: "Which sentence uses the semicolon correctly?", a: `I was tired; I went to bed early.`, d: [`I was tired, I went to bed early.`, `I was tired; and I went to bed early.`, `I was tired I went to bed early.`] },
    { q: "Which sentence uses the colon correctly?", a: `You need three things: a pen, paper and a ruler.`, d: [`You need three things; a pen, paper and a ruler.`, `You need three things, a pen, paper and a ruler.`, `You need: three things a pen, paper and a ruler.`] },
    { q: "Which shows correct speech punctuation?", a: `Omar said, "I'll be there soon."`, d: [`Omar said "I'll be there soon".`, `Omar said, "i'll be there soon."`, `Omar said "I'll be there soon"`] },
    { q: "Which sentence is punctuated correctly?", a: `My brother, who is ten, plays chess.`, d: [`My brother who is ten, plays chess.`, `My brother, who is ten plays chess.`, `My brother who is ten plays chess.`] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}`);
};

GEN.question_tag = (rng) => {
  const set = [["You are coming,", "aren't you?"], ["She can swim,", "can't she?"], ["They don't know,", "do they?"], ["He has finished,", "hasn't he?"], ["We should leave,", "shouldn't we?"], ["It isn't fair,", "is it?"], ["You like tea,", "don't you?"], ["She won't mind,", "will she?"]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Add the correct question tag:  "${p[0]} ___"`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `A positive statement takes a negative tag (and the reverse). → "${p[0]} ${p[1]}"`);
};

GEN.vocab_hard = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const set = [["enormous", "huge", ["tiny", "narrow"]], ["ancient", "very old", ["brand new", "modern"]], ["furious", "very angry", ["pleased", "calm"]], ["exhausted", "very tired", ["energetic", "lively"]], ["delighted", "very happy", ["miserable", "bored"]], ["gigantic", "massive", ["minute", "slight"]], ["terrified", "very scared", ["fearless", "bold"]], ["reluctant", "unwilling", ["eager", "keen"]], ["generous", "giving freely", ["selfish", "mean"]], ["fragile", "easily broken", ["sturdy", "tough"]]]; const p = R.pick(rng, set); return mcq(rng, `Which word means the SAME as "${p[0]}"?`, p[1], p[2], `"${p[0]}" means "${p[1]}".`); }
  if (t === 1) { const set = [["un", "happy", "unhappy", "not happy"], ["re", "build", "rebuild", "build again"], ["dis", "agree", "disagree", "not agree"], ["pre", "view", "preview", "view beforehand"], ["mis", "spell", "misspell", "spell wrongly"], ["over", "cook", "overcook", "cook too much"], ["under", "paid", "underpaid", "paid too little"], ["im", "possible", "impossible", "not possible"]]; const p = R.pick(rng, set); return mcq(rng, `Add the prefix "${p[0]}-" to "${p[1]}". What does "${p[2]}" mean?`, p[3], ["a kind of food", "a place to live", "the name of a colour"], `"${p[0]}${p[1]}" means "${p[3]}".`); }
  const set = [["a piece of cake", "very easy"], ["under the weather", "feeling ill"], ["break the ice", "start a conversation"], ["once in a blue moon", "very rarely"], ["hit the books", "start studying hard"], ["let the cat out of the bag", "reveal a secret"]]; const p = R.pick(rng, set);
  return mcq(rng, `What does the idiom "${p[0]}" mean?`, p[1], ["a kind of animal", "a cooking method", "a type of weather"], `The idiom "${p[0]}" means "${p[1]}".`);
};

/* ---- SCIENCE (grade 6) ------------------------------------------------ */
GEN.matter_states = (rng) => {
  const set = [
    { q: "Which state of matter has a FIXED shape and fixed volume?", a: "Solid", d: ["Liquid", "Gas", "Vapour"] },
    { q: "Which state takes the shape of its container but has a fixed volume?", a: "Liquid", d: ["Solid", "Gas", "Crystal"] },
    { q: "Which state has NO fixed shape and NO fixed volume?", a: "Gas", d: ["Solid", "Liquid", "Ice"] },
    { q: "The change from a solid to a liquid is called...", a: "Melting", d: ["Freezing", "Evaporation", "Condensation"] },
    { q: "The change from a liquid to a gas is called...", a: "Evaporation (boiling)", d: ["Melting", "Condensation", "Freezing"] },
    { q: "The change from a gas to a liquid is called...", a: "Condensation", d: ["Evaporation", "Melting", "Sublimation"] },
    { q: "The change from a liquid to a solid is called...", a: "Freezing", d: ["Melting", "Boiling", "Condensation"] },
    { q: "In which state are the particles packed most tightly and vibrate in place?", a: "Solid", d: ["Liquid", "Gas", "Steam"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.phys_chem_change = (rng) => {
  const set = [["Ice melting", "Physical change"], ["Paper burning", "Chemical change"], ["Boiling water", "Physical change"], ["Rusting of iron", "Chemical change"], ["Cutting paper", "Physical change"], ["Cooking an egg", "Chemical change"], ["Dissolving sugar in water", "Physical change"], ["A firework exploding", "Chemical change"], ["Tearing cloth", "Physical change"], ["Milk turning sour", "Chemical change"], ["Freezing water", "Physical change"], ["Baking a cake", "Chemical change"]];
  const p = R.pick(rng, set), other = p[1] === "Physical change" ? "Chemical change" : "Physical change";
  return mcq(rng, `Is this a PHYSICAL or a CHEMICAL change?  "${p[0]}"`, p[1], [other], `${p[0]} is a ${p[1].toLowerCase()}${p[1] === "Physical change" ? " — no new substance forms and it can usually be reversed." : " — a new substance forms and it is hard to reverse."}`);
};

GEN.elements_compounds = (rng) => {
  const set = [
    { q: "Which of these is an ELEMENT?", a: "Oxygen", d: ["Water", "Air", "Salt"] },
    { q: "Which of these is a COMPOUND?", a: "Water (H₂O)", d: ["Oxygen", "Gold", "Iron"] },
    { q: "Which of these is a MIXTURE?", a: "Air", d: ["Water", "Carbon dioxide", "Copper"] },
    { q: "A substance made of only one kind of atom is an...", a: "Element", d: ["Compound", "Mixture", "Solution"] },
    { q: "Two or more elements chemically joined together form a...", a: "Compound", d: ["Element", "Mixture", "Atom"] },
    { q: "How would you separate sand from water?", a: "Filtering", d: ["Evaporation", "Using a magnet", "Freezing"] },
    { q: "How would you get salt back from salty water?", a: "Evaporation", d: ["Filtering", "Sieving", "Using a magnet"] },
    { q: "How would you separate iron filings from sand?", a: "Using a magnet", d: ["Filtering", "Evaporation", "Boiling"] },
    { q: "The smallest particle of an element is an...", a: "Atom", d: ["Compound", "Mixture", "Cell"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.forces_machines = (rng) => {
  const set = [
    { q: "A push or a pull is called a...", a: "Force", d: ["Mass", "Energy", "Speed"] },
    { q: "The force that slows down a sliding object is...", a: "Friction", d: ["Gravity", "Magnetism", "Upthrust"] },
    { q: "A seesaw is an example of which simple machine?", a: "Lever", d: ["Pulley", "Wheel and axle", "Screw"] },
    { q: "Which simple machine helps raise a flag up a pole?", a: "Pulley", d: ["Lever", "Wedge", "Ramp"] },
    { q: "A ramp (sloping surface) is a simple machine called an...", a: "Inclined plane", d: ["Pulley", "Lever", "Gear"] },
    { q: "The force that pulls everything towards the Earth is...", a: "Gravity", d: ["Friction", "Magnetism", "Tension"] },
    { q: "Which force keeps a boat floating on water?", a: "Upthrust (buoyancy)", d: ["Friction", "Gravity only", "Magnetism"] },
    { q: "Simple machines make work easier by...", a: "Reducing the effort needed", d: ["Adding more weight", "Using more force", "Slowing you down"] },
    { q: "The unit used to measure force is the...", a: "Newton (N)", d: ["Kilogram", "Metre", "Litre"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.energy_forms = (rng) => {
  const set = [
    { q: "What form of energy does a moving car have?", a: "Kinetic (movement) energy", d: ["Sound energy", "Light energy", "Chemical energy"] },
    { q: "What form of energy is stored in food and batteries?", a: "Chemical energy", d: ["Kinetic energy", "Sound energy", "Light energy"] },
    { q: "A torch mainly changes electrical energy into...", a: "Light energy", d: ["Sound energy", "Chemical energy", "Nuclear energy"] },
    { q: "The Sun gives us mainly light and ___ energy.", a: "heat (thermal)", d: ["sound", "chemical", "electrical"] },
    { q: "Energy cannot be created or destroyed, only...", a: "changed from one form to another", d: ["made from nothing", "used up forever", "copied"] },
    { q: "A stretched spring or a raised object stores ___ energy.", a: "potential", d: ["sound", "light", "electrical"] },
    { q: "A loudspeaker changes electrical energy into...", a: "sound energy", d: ["light energy", "chemical energy", "heat only"] },
    { q: "Which of these is a RENEWABLE energy source?", a: "Solar (the Sun)", d: ["Coal", "Oil", "Natural gas"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.magnetism = (rng) => {
  const set = [
    { q: "The two ends of a magnet are called its...", a: "North and South poles", d: ["top and bottom", "positive and negative", "left and right"] },
    { q: "What happens when two NORTH poles are brought together?", a: "They repel (push apart)", d: ["They attract", "Nothing happens", "They stick"] },
    { q: "What happens when a north pole meets a south pole?", a: "They attract (pull together)", d: ["They repel", "They explode", "Nothing"] },
    { q: "Which material is magnetic?", a: "Iron", d: ["Plastic", "Wood", "Copper"] },
    { q: "A magnet made using an electric current is an...", a: "Electromagnet", d: ["Insulator", "Conductor", "Compass"] },
    { q: "A compass needle always settles pointing roughly...", a: "North–South", d: ["East only", "Up", "Down"] },
    { q: "Where is a magnet's pull the strongest?", a: "At the poles", d: ["In the middle", "Everywhere equally", "At the top only"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.photosynthesis = (rng) => {
  const set = [
    { q: "Which gas do plants take IN during photosynthesis?", a: "Carbon dioxide", d: ["Oxygen", "Nitrogen", "Hydrogen"] },
    { q: "Which gas do plants give OUT during photosynthesis?", a: "Oxygen", d: ["Carbon dioxide", "Helium", "Methane"] },
    { q: "What green pigment traps light energy in a leaf?", a: "Chlorophyll", d: ["Chloroform", "Cytoplasm", "Keratin"] },
    { q: "Which part of the plant carries out most photosynthesis?", a: "The leaves", d: ["The roots", "The flower", "The seeds"] },
    { q: "Besides carbon dioxide and light, what else do plants need for photosynthesis?", a: "Water", d: ["Salt", "Oil", "Sand"] },
    { q: "What food (sugar) do plants make during photosynthesis?", a: "Glucose", d: ["Protein", "Fat", "Vitamin C"] },
    { q: "Where does the energy for photosynthesis come from?", a: "Sunlight", d: ["The soil", "The wind", "The Moon"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.cells = (rng) => {
  const set = [
    { q: "The basic building block of all living things is the...", a: "Cell", d: ["Atom", "Organ", "Tissue"] },
    { q: "Which part controls the cell and holds the genetic material?", a: "Nucleus", d: ["Cell wall", "Cytoplasm", "Membrane"] },
    { q: "Which part is found in PLANT cells but NOT in animal cells?", a: "Cell wall", d: ["Nucleus", "Cytoplasm", "Cell membrane"] },
    { q: "The jelly-like substance where reactions happen is the...", a: "Cytoplasm", d: ["Nucleus", "Cell wall", "Chloroplast"] },
    { q: "Which part of a plant cell traps light for photosynthesis?", a: "Chloroplast", d: ["Nucleus", "Vacuole", "Cell wall"] },
    { q: "The thin layer controlling what enters and leaves a cell is the...", a: "Cell membrane", d: ["Cell wall", "Nucleus", "Vacuole"] },
    { q: "A group of similar cells working together forms a...", a: "Tissue", d: ["Organ", "Organism", "Molecule"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.measurement = (rng) => {
  const set = [
    { q: "Which unit is used to measure LENGTH?", a: "Metre", d: ["Litre", "Gram", "Second"] },
    { q: "Which unit is used to measure MASS?", a: "Kilogram", d: ["Metre", "Litre", "Newton"] },
    { q: "Which unit is used to measure the VOLUME of a liquid?", a: "Litre", d: ["Metre", "Gram", "Second"] },
    { q: "Which instrument measures temperature?", a: "Thermometer", d: ["Ruler", "Balance", "Stopwatch"] },
    { q: "Which instrument measures time accurately?", a: "Stopwatch", d: ["Thermometer", "Ruler", "Beaker"] },
    { q: "How many centimetres are there in 1 metre?", a: "100", d: ["10", "1000", "12"] },
    { q: "How many millilitres are there in 1 litre?", a: "1000", d: ["100", "10", "500"] },
    { q: "Which instrument is used to measure the mass of an object?", a: "A balance (scales)", d: ["A thermometer", "A measuring cylinder", "A ruler"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

/* ==========================================================================
 * TIER 9 — CHALLENGE LEVEL (very hard, still ON the same Grade-6 topics)
 * These overrides raise difficulty to the top of the scale. Difficulty comes
 * from multi-step reasoning, awkward numbers and tougher distractors ONLY —
 * no new topics are introduced; every item stays inside the child's strands.
 * ========================================================================== */
const lcm2 = (a, b) => a * b / gcd(a, b);

/* ---------------------------- MATHS ----------------------------------- */
GEN.data_mean_hard = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { // missing value given the mean
    let vals, missing, mean, n, guard = 0;
    do { n = R.int(rng, 4, 6); mean = R.int(rng, 30, 85); vals = Array.from({ length: n - 1 }, () => R.int(rng, 18, 98)); missing = mean * n - vals.reduce((a, b) => a + b, 0); guard++; } while ((missing < 1 || missing > 170) && guard < 40);
    const known0 = vals.reduce((a, b) => a + b, 0);
    return mcqNum(rng, `The mean of ${n} numbers is ${mean}. The other ${n - 1} numbers are ${vals.join(", ")}. Find the missing number.`, missing, [mean, mean * n, missing + 10, missing - 10], `Total must be ${mean}\u00D7${n}=${mean * n}. Subtract the known ${known0} \u2192 ${missing}.`);
  }
  if (t === 1) { // combined mean of two groups
    let a, b, ma, mb, mean, guard = 0;
    do { a = R.int(rng, 3, 8); b = R.int(rng, 3, 8); ma = R.int(rng, 12, 48); mb = R.int(rng, 12, 48); mean = (a * ma + b * mb) / (a + b); guard++; } while (!Number.isInteger(mean) && guard < 60);
    const total = a * ma + b * mb;
    return mcqNum(rng, `A group of ${a} pupils has a mean score of ${ma}. A second group of ${b} pupils has a mean of ${mb}. What is the mean of all ${a + b} pupils together?`, mean, [Math.round((ma + mb) / 2), ma + mb, mean + 2, mean - 2], `Total marks = ${a}\u00D7${ma}+${b}\u00D7${mb}=${total}. Divide by ${a + b}: ${mean}.`);
  }
  let data, sum, n = 6, guard = 0;
  do { data = Array.from({ length: n }, () => R.int(rng, 25, 120)); sum = data.reduce((a, b) => a + b, 0); const rem = sum % n; data[0] -= rem; sum -= rem; guard++; } while (data[0] < 1 && guard < 40);
  const mean = sum / n;
  return mcqNum(rng, `Find the mean of these six numbers: ${data.join(", ")}.`, mean, [mean + 3, mean - 4, Math.max(...data), Math.round(sum / (n - 1))], `Add all six (${sum}) and divide by ${n}: ${mean}.`);
};

GEN.data_median = (rng) => {
  const even = rng() < 0.5;
  const n = even ? R.int(rng, 3, 4) * 2 : R.int(rng, 3, 4) * 2 + 1;
  const data = Array.from({ length: n }, () => R.int(rng, 5, 60));
  const sorted = data.slice().sort((a, b) => a - b);
  let med;
  if (n % 2) med = sorted[(n - 1) / 2]; else med = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const ans = Number.isInteger(med) ? med : +med.toFixed(1);
  return mcqNum(rng, `Find the MEDIAN of this data \u2014 remember to order it first:  ${data.join(", ")}.`, ans, [+((data[0] + data[n - 1]) / 2).toFixed(1), sorted[Math.floor(n / 2)], ans + 1, ans - 2], `In order: ${sorted.join(", ")}. ${n % 2 ? `The middle value is ${ans}.` : `Average the two middle values (${sorted[n / 2 - 1]} & ${sorted[n / 2]}) \u2192 ${ans}.`}`);
};

GEN.data_mode = (rng) => {
  const vals = R.shuffle(rng, [2, 3, 4, 5, 6, 7]).slice(0, 4);
  const freqs = R.shuffle(rng, [2, 4, 5, 7]);
  let maxi = 0; for (let i = 1; i < 4; i++) if (freqs[i] > freqs[maxi]) maxi = i;
  const rows = vals.map((v, i) => `size ${v} \u2192 ${freqs[i]} pupils`).join(",  ");
  return mcqNum(rng, `A survey of shoe sizes gave:  ${rows}.  Which size is the MODE?`, vals[maxi], vals.filter((_, i) => i !== maxi), `The mode has the highest frequency (${freqs[maxi]} pupils) \u2192 size ${vals[maxi]}.`);
};

GEN.data_range = (rng) => {
  if (rng() < 0.5) {
    const min = R.int(rng, 3, 20), range = R.int(rng, 15, 40), max = min + range;
    return mcqNum(rng, `A data set has a range of ${range} and its smallest value is ${min}. What is the largest value?`, max, [range, Math.floor(min + range / 2), max + min, range - min], `Range = largest \u2212 smallest, so largest = ${min} + ${range} = ${max}.`);
  }
  const data = Array.from({ length: 6 }, () => R.int(rng, -10, 40));
  const range = Math.max(...data) - Math.min(...data);
  return mcqNum(rng, `Find the RANGE of:  ${data.join(", ")}  (watch the negative numbers!).`, range, [Math.max(...data) + Math.min(...data), Math.max(...data), range + 5, range - 3], `Range = biggest (${Math.max(...data)}) \u2212 smallest (${Math.min(...data)}) = ${range}.`);
};

GEN.graph_read = (rng) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const vals = days.map(() => R.int(rng, 2, 9) * 5);
  const t = R.int(rng, 0, 2);
  if (t === 0) { const tot = vals.reduce((a, b) => a + b, 0); return mcqNum(rng, `A bar chart shows books read: ${days.map((d, i) => d + " " + vals[i]).join(", ")}. How many books were read in total?`, tot, [tot - vals[0], Math.round(tot / 5), tot + 5, tot - 10], `Add all five bars: ${vals.join("+")} = ${tot}.`); }
  if (t === 1) { const mean = Math.round(vals.reduce((a, b) => a + b, 0) / 5); const hi = Math.max(...vals); return mcqNum(rng, `A bar chart shows: ${days.map((d, i) => d + " " + vals[i]).join(", ")}. How many MORE than the daily mean (${mean}) was the busiest day?`, hi - mean, [hi, mean, hi - Math.min(...vals), hi + mean], `Busiest = ${hi}; mean = ${mean}; difference = ${hi - mean}.`); }
  let a = R.int(rng, 0, 4), b = R.int(rng, 0, 4); if (b === a) b = (b + 1) % 5;
  const diff = Math.abs(vals[a] - vals[b]);
  return mcqNum(rng, `On the chart, ${days[a]} = ${vals[a]} and ${days[b]} = ${vals[b]}. How many more were read on the higher day?`, diff, [vals[a] + vals[b], diff + 5, Math.round(diff / 2), Math.max(diff - 5, 1)], `Difference = |${vals[a]} \u2212 ${vals[b]}| = ${diff}.`);
};

GEN.bar_compare = (rng) => {
  const b = R.int(rng, 2, 8) * 3, mult = R.int(rng, 2, 4), a = b * mult;
  if (rng() < 0.5) return mcqNum(rng, `Team A scored ${a} points and Team B scored ${b}. Team A's score is how many TIMES Team B's?`, mult, [a - b, a + b, mult + 1, b], `${a} \u00F7 ${b} = ${mult} times.`);
  const diff = a - b;
  return mcqNum(rng, `Team A scored ${a} and Team B scored ${b}. How many points did Team A win by?`, diff, [a + b, diff + 3, Math.round(diff / 2), Math.max(diff - 3, 1)], `Difference = ${a} \u2212 ${b} = ${diff}.`);
};

GEN.frac_to_dec_pct = (rng) => {
  const set = [[1, 8, 0.125, 12.5], [3, 8, 0.375, 37.5], [5, 8, 0.625, 62.5], [7, 8, 0.875, 87.5], [1, 20, 0.05, 5], [3, 20, 0.15, 15], [7, 20, 0.35, 35], [9, 20, 0.45, 45], [2, 5, 0.4, 40], [1, 40, 0.025, 2.5]];
  const p = R.pick(rng, set);
  if (rng() < 0.5) return mcqNum(rng, `Write ${p[0]}/${p[1]} as a DECIMAL.`, p[2], [+(p[2] * 10).toFixed(3), +(p[2] / 2).toFixed(3), +(p[2] + 0.05).toFixed(3), +(p[0] / (p[1] + 1)).toFixed(3)], `${p[0]} \u00F7 ${p[1]} = ${p[2]}.`);
  return mcqNum(rng, `Write ${p[0]}/${p[1]} as a PERCENTAGE.`, p[3], [p[3] * 2, +(p[3] / 2).toFixed(1), p[3] + 5, p[1] - p[0]], `${p[0]}/${p[1]} = ${p[2]} = ${p[3]}%.`);
};

GEN.simplify_fraction = (rng) => {
  const g = R.int(rng, 6, 16), a = R.int(rng, 2, 8), b = a + R.int(rng, 1, 7), N = a * g, D = b * g;
  return mcq(rng, `Write ${N}/${D} in its LOWEST terms.`, `${a}/${b}`, [`${a + 1}/${b}`, `${a}/${b + 1}`, `${a + 1}/${b + 1}`], `The HCF of ${N} and ${D} is ${g}; divide both \u2192 ${a}/${b}.`);
};

GEN.add_sub_fraction = (rng) => {
  const pool = [3, 4, 5, 6, 8, 10, 12];
  let D1, D2, n1, n2, A, B, num, sign, L, guard = 0;
  const add = rng() < 0.55;
  do {
    D1 = R.pick(rng, pool); D2 = R.pick(rng, pool.filter(x => x !== D1));
    n1 = R.int(rng, 1, D1 - 1); n2 = R.int(rng, 1, D2 - 1);
    L = lcm2(D1, D2); A = n1 * (L / D1); B = n2 * (L / D2);
    if (add) { num = A + B; sign = "+"; }
    else { if (A < B) { let t = A; A = B; B = t; t = n1; n1 = n2; n2 = t; t = D1; D1 = D2; D2 = t; } num = A - B; sign = "\u2212"; }
    guard++;
  } while ((num <= 0 || num >= L || A === B) && guard < 80);
  const g = gcd(num, L), rn = num / g, rd = L / g;
  const ansStr = `${rn}/${rd}`;
  return mcq(rng, `Work out  ${n1}/${D1} ${sign} ${n2}/${D2}  and give your answer in its lowest terms.`, ansStr, [`${n1 + n2}/${D1 + D2}`, `${rn + 1}/${rd}`, `${rn}/${rd + 2}`], `Use the common denominator ${L}: ${A}/${L} ${sign} ${B}/${L} = ${num}/${L}${g > 1 ? ` = ${ansStr}` : ""}.`);
};

GEN.frac_of = (rng) => {
  const den = R.pick(rng, [3, 4, 5, 6, 8, 10, 12]), num = R.int(rng, 1, den - 1), whole = den * R.int(rng, 6, 20), part = whole * num / den;
  if (rng() < 0.5) { const remain = whole - part; return mcqNum(rng, `In a school of ${whole} pupils, ${num}/${den} walk to school. How many do NOT walk?`, remain, [part, whole, remain + den, Math.max(remain - num, 1)], `Walkers = ${num}/${den} \u00D7 ${whole} = ${part}. Not walking = ${whole} \u2212 ${part} = ${remain}.`); }
  return mcqNum(rng, `What is ${num}/${den} of ${whole}?`, part, [whole - part, Math.round(whole / den), part + num, Math.floor(whole / Math.max(num, 1))], `${whole} \u00F7 ${den} = ${whole / den}, then \u00D7 ${num} = ${part}.`);
};

GEN.ratio_simple = (rng) => {
  let [a, b, c] = R.shuffle(rng, [1, 2, 3, 4, 5, 6]).slice(0, 3);
  const g0 = gcd(gcd(a, b), c); a /= g0; b /= g0; c /= g0;
  const part = R.int(rng, 3, 12), total = (a + b + c) * part, mx = Math.max(a, b, c), mn = Math.min(a, b, c);
  if (rng() < 0.5) return mcqNum(rng, `Three friends share ${total} marbles in the ratio ${a}:${b}:${c}. How many does the friend with the LARGEST share get?`, mx * part, [mn * part, total, part, mx * part + part], `Parts = ${a + b + c}. One part = ${total} \u00F7 ${a + b + c} = ${part}. Largest = ${mx} \u00D7 ${part}.`);
  return mcq(rng, `Simplify the ratio  ${a * part} : ${b * part} : ${c * part}  to its simplest form.`, `${a}:${b}:${c}`, [`${b}:${a}:${c}`, `${a * 2}:${b * 2}:${c * 2}`, `${a + 1}:${b}:${c}`], `Divide all three by ${part}: ${a}:${b}:${c}.`);
};

GEN.ratio_share = (rng) => {
  let [a, b] = R.shuffle(rng, [2, 3, 4, 5, 7, 8, 9]).slice(0, 2);
  const part = R.int(rng, 4, 14), total = (a + b) * part, mx = Math.max(a, b), mn = Math.min(a, b), t = R.int(rng, 0, 2);
  if (t === 0) return mcqNum(rng, `\u00A3${total} is shared in the ratio ${a}:${b}. How much is the SMALLER share?`, mn * part, [mx * part, total, part, mn * part + part], `One part = \u00A3${part}. Smaller share = ${mn} \u00D7 ${part}.`);
  if (t === 1) { const diff = (mx - mn) * part; return mcqNum(rng, `Two people share money in the ratio ${a}:${b}. One receives \u00A3${diff} MORE than the other. How much was shared altogether?`, total, [diff, mx * part, total + part, diff * 2], `The difference is ${mx - mn} ${mx - mn === 1 ? "part" : "parts"} = \u00A3${diff}, so one part = \u00A3${part}. Total = ${a + b} parts = \u00A3${total}.`); }
  const bigger = mx * part;
  return mcqNum(rng, `Sweets are shared in the ratio ${a}:${b}. The larger share is ${bigger} sweets. How many sweets were there in total?`, total, [bigger, mn * part, total + part, bigger + part], `Larger = ${mx} parts = ${bigger}, so one part = ${part}. Total = ${a + b} parts = ${total}.`);
};

GEN.decimal_ops = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const a = R.int(rng, 21, 95) / 10, b = R.int(rng, 3, 12), c = R.int(rng, 15, 60) / 10, ans = +(a * b - c).toFixed(2); return mcqNum(rng, `Work out  ${a} \u00D7 ${b} \u2212 ${c}.`, ans, [+(a * b - c + 1).toFixed(2), +((a - c) * b).toFixed(2), +(a * b + c).toFixed(2), +(ans - 0.5).toFixed(2)], `\u00D7 before \u2212: ${a}\u00D7${b}=${+(a * b).toFixed(2)}; then \u2212${c} = ${ans}.`); }
  if (t === 1) { const q = R.int(rng, 12, 60) / 10, n = R.pick(rng, [2, 4, 5]), a = +(q * n).toFixed(1); return mcqNum(rng, `Work out  ${a} \u00F7 ${n}.`, q, [+(a - n).toFixed(2), +(q + 0.5).toFixed(2), +(a / (n + 1)).toFixed(2), +(q - 0.3).toFixed(2)], `${a} \u00F7 ${n} = ${q}.`); }
  const a = R.int(rng, 10, 50) / 100, b = R.int(rng, 10, 90) / 100, ans = +(a + b).toFixed(2);
  return mcqNum(rng, `Work out  ${a} + ${b}.`, ans, [+(a * b).toFixed(3), +(ans + 0.1).toFixed(2), +Math.abs(a - b).toFixed(2), +(ans - 0.02).toFixed(2)], `Line up the decimal points: ${a} + ${b} = ${ans}.`);
};

GEN.percentage = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const pct = R.pick(rng, [5, 10, 20, 25, 40, 50]), whole = R.int(rng, 4, 22) * 20, part = whole * pct / 100; return mcqNum(rng, `${pct}% of a number is ${part}. What is the number?`, whole, [part, part * 2, whole + pct, part + pct], `If ${pct}% = ${part}, then 1% = ${part / pct}, so 100% = ${whole}.`); }
  if (t === 1) return mcqNum(rng, `A \u00A3200 jacket rises in price by 20%, then is reduced by 20% in a sale. What is the final price?`, 192, [200, 208, 184, 196], `+20% \u2192 \u00A3240; then \u221220% of 240 = \u00A348 \u2192 \u00A3192 (it does NOT return to \u00A3200).`);
  const whole = R.int(rng, 5, 24) * 20, pct = R.pick(rng, [12, 15, 35, 45, 65, 85]), part = whole * pct / 100, ans = Number.isInteger(part) ? part : +part.toFixed(2);
  return mcqNum(rng, `Find ${pct}% of ${whole}.`, ans, [whole - pct, +(ans + pct).toFixed(2), +(ans / 2).toFixed(2), +(whole * pct / 1000).toFixed(2)], `${pct}% = ${pct}/100 \u00D7 ${whole} = ${ans}.`);
};

GEN.integers = (rng) => {
  const a = R.int(rng, -15, -3), b = R.int(rng, 3, 12), c = R.int(rng, -12, -3), t = R.int(rng, 0, 2);
  if (t === 0) { const ans = a - b * c; return mcqNum(rng, `Work out  ${a} \u2212 ${b} \u00D7 (${c}).`, ans, [(a - b) * c, a - b + c, a + b * c, ans + 2], `\u00D7 first: ${b}\u00D7(${c})=${b * c}; ${a}\u2212(${b * c})=${ans}.`); }
  if (t === 1) { const ans = (a + c) * b; return mcqNum(rng, `Work out  (${a} + ${c}) \u00D7 ${b}.`, ans, [a + c * b, a * b + c, ans + b, -ans], `Brackets first: ${a}+(${c})=${a + c}; \u00D7${b}=${ans}.`); }
  const d = R.int(rng, 2, 6), val = b * d, ans = a - val / d;
  return mcqNum(rng, `Work out  ${a} \u2212 ${val} \u00F7 ${d}.`, ans, [(a - val) / d, a - val, ans + d, -ans], `\u00F7 first: ${val}\u00F7${d}=${val / d}; ${a}\u2212${val / d}=${ans}.`);
};

GEN.order_ops_hard = (rng) => {
  const a = R.int(rng, 3, 9), b = R.int(rng, 3, 8), c = R.int(rng, 2, 7), d = R.int(rng, 3, 8), t = R.int(rng, 0, 2);
  if (t === 0) { const ans = a * (b + c) - d * d; return mcqNum(rng, `Work out  ${a} \u00D7 (${b} + ${c}) \u2212 ${d}\u00B2.`, ans, [a * b + c - d * d, (a * b + c - d) * d, a * (b + c) - d * 2, ans + d], `Brackets ${b + c}, \u00D7${a}=${a * (b + c)}; ${d}\u00B2=${d * d}; subtract \u2192 ${ans}.`); }
  if (t === 1) { const inner = b + c, ans = a * a - inner * d; return mcqNum(rng, `Work out  ${a}\u00B2 \u2212 (${b} + ${c}) \u00D7 ${d}.`, ans, [(a * a - inner) * d, a * 2 - inner * d, a * a - inner + d, ans - 1], `${a}\u00B2=${a * a}; (${b}+${c})\u00D7${d}=${inner * d}; ${a * a}\u2212${inner * d}=${ans}.`); }
  const q = R.int(rng, 2, 6), prod = b * q, ans = a + prod / b - c;
  return mcqNum(rng, `Work out  ${a} + ${prod} \u00F7 ${b} \u2212 ${c}.`, ans, [(a + prod) / b - c, a + prod / b + c, a + Math.floor(prod / (b * c)), ans + 2], `\u00F7 before + and \u2212: ${prod}\u00F7${b}=${prod / b}; ${a}+${prod / b}\u2212${c}=${ans}.`);
};

GEN.algebra_eval = (rng) => {
  const x = R.int(rng, 3, 9), y = R.int(rng, 3, 9);
  if (rng() < 0.5) { const a = R.int(rng, 2, 6), b = R.int(rng, 2, 6), ans = a * x * x - b * y; return mcqNum(rng, `If x = ${x} and y = ${y}, find the value of  ${a}x\u00B2 \u2212 ${b}y.`, ans, [a * x * 2 - b * y, a * x - b * y, a * x * x + b * y, ans + a], `x\u00B2=${x * x}; ${a}\u00D7${x * x}=${a * x * x}; \u2212${b}\u00D7${y}=${ans}.`); }
  const a = R.int(rng, 2, 5), b = R.int(rng, 2, 6), c = R.int(rng, 1, 9), ans = a * x * y + b * x - c;
  return mcqNum(rng, `If x = ${x} and y = ${y}, find the value of  ${a}xy + ${b}x \u2212 ${c}.`, ans, [a * (x + y) + b * x - c, a * x * y + b - c, a * x * y + b * x + c, ans - 2], `xy=${x * y}; ${a}\u00D7${x * y}=${a * x * y}; +${b}\u00D7${x}=${a * x * y + b * x}; \u2212${c}=${ans}.`);
};

GEN.algebra_solve = (rng) => {
  const x = R.int(rng, 3, 12);
  if (rng() < 0.5) { const a = R.int(rng, 5, 10), c = R.int(rng, 2, a - 2), b = R.int(rng, 1, 12), d = b + (a - c) * x; return mcqNum(rng, `Solve for x:   ${a}x + ${b} = ${c}x + ${d}`, x, [x + 1, x - 1, d - b, x + 2], `Subtract ${c}x from both sides: ${a - c}x + ${b} = ${d}. Subtract ${b}: ${a - c}x = ${d - b}. Divide by ${a - c}: x = ${x}.`); }
  const a = R.int(rng, 3, 7), b = R.int(rng, 2, 9), rhs = a * (x + b);
  return mcqNum(rng, `Solve for x:   ${a}(x + ${b}) = ${rhs}`, x, [x + b, x + 1, rhs - b, x - 1], `Divide by ${a}: x + ${b} = ${rhs / a}. Subtract ${b}: x = ${x}.`);
};

GEN.mensuration = (rng) => {
  const t = R.int(rng, 0, 3);
  if (t === 0) { const w = R.int(rng, 4, 15), l = R.int(rng, 6, 22), area = w * l; return mcqNum(rng, `A rectangle has an area of ${area} cm\u00B2 and a width of ${w} cm. Find its LENGTH.`, l, [area - w, area, l + w, Math.round(area / (w + 1))], `Length = area \u00F7 width = ${area} \u00F7 ${w} = ${l} cm.`); }
  if (t === 1) { const A = R.int(rng, 10, 18), B = R.int(rng, 8, 15), a = R.int(rng, 2, A - 3), b = R.int(rng, 2, B - 3), ans = A * B - a * b; return mcqNum(rng, `An L-shape is a ${A} cm \u00D7 ${B} cm rectangle with a ${a} cm \u00D7 ${b} cm corner cut out. Find its area.`, ans, [A * B + a * b, A * B, 2 * (A + B), ans - a], `Whole rectangle ${A}\u00D7${B}=${A * B}; remove ${a}\u00D7${b}=${a * b}; area = ${ans} cm\u00B2.`); }
  if (t === 2) { const l = R.int(rng, 3, 9), w = R.int(rng, 3, 9), h = R.int(rng, 3, 9), ans = 2 * (l * w + w * h + l * h); return mcqNum(rng, `Find the total SURFACE AREA of a cuboid measuring ${l} \u00D7 ${w} \u00D7 ${h} cm.`, ans, [l * w * h, l * w + w * h + l * h, 2 * (l + w + h), ans + l], `SA = 2(lw+wh+lh) = 2(${l * w}+${w * h}+${l * h}) = ${ans} cm\u00B2.`); }
  const b = R.int(rng, 4, 16), h = R.int(rng, 3, 9) * 2, tri = b * h / 2;
  return mcqNum(rng, `A triangle has an area of ${tri} cm\u00B2 and a base of ${b} cm. Find its HEIGHT.`, h, [h + 2, Math.max(h - 3, 1), b, tri], `Area = \u00BD \u00D7 base \u00D7 height, so height = 2 \u00D7 area \u00F7 base = ${2 * tri} \u00F7 ${b} = ${h} cm.`);
};

GEN.hcf_lcm = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const a = R.pick(rng, [4, 6, 8, 9, 12]), b = R.pick(rng, [5, 6, 10, 15]), l = lcm2(a, b); return mcqNum(rng, `One bell rings every ${a} minutes and another every ${b} minutes. If they ring together now, after how many minutes will they NEXT ring together?`, l, [a * b, a + b, gcd(a, b), l + a], `They coincide at the LCM of ${a} and ${b} = ${l} minutes.`); }
  if (t === 1) { const g = R.int(rng, 3, 9), a = g * R.int(rng, 2, 5), b = g * R.int(rng, 2, 5), G = gcd(a, b); return mcqNum(rng, `Two ribbons are ${a} cm and ${b} cm long. They are cut into equal pieces that are as LONG as possible with none left over. How long is each piece?`, G, [a * b, a + b, Math.min(a, b), G + 1], `The longest equal piece = HCF of ${a} and ${b} = ${G} cm.`); }
  const a = R.int(rng, 2, 9), b = R.int(rng, 2, 9), c = R.int(rng, 2, 9), l = lcm2(lcm2(a, b), c);
  return mcqNum(rng, `Find the LCM of ${a}, ${b} and ${c}.`, l, [a * b * c, a + b + c, gcd(gcd(a, b), c), l + a], `The smallest number all three divide into exactly is ${l}.`);
};

GEN.prob_fraction = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const r = R.int(rng, 2, 5), b = R.int(rng, 2, 5), g = R.int(rng, 2, 5), y = R.int(rng, 1, 4), tot = r + b + g + y, gg = gcd(r + b, tot); return mcq(rng, `A spinner has ${r} red, ${b} blue, ${g} green and ${y} yellow equal sections. What is P(red OR blue), in lowest terms?`, `${(r + b) / gg}/${tot / gg}`, [`${r + b}/${tot + 1}`, `${r}/${tot}`, `${g + y}/${tot}`], `Red or blue = ${r + b} of ${tot} sections = ${(r + b) / gg}/${tot / gg}.`); }
  if (t === 1) { const r = R.int(rng, 3, 6), b = R.int(rng, 3, 6), tot = r + b; return mcq(rng, `A bag has ${r} red and ${b} blue counters. One red counter is taken out and NOT replaced. What is the probability the next counter is red?`, `${r - 1}/${tot - 1}`, [`${r}/${tot}`, `${r - 1}/${tot}`, `${r}/${tot - 1}`], `After removing a red, ${r - 1} red remain out of ${tot - 1} counters \u2192 ${r - 1}/${tot - 1}.`); }
  const s = R.int(rng, 1, 6);
  return mcq(rng, `Two fair dice are rolled. What is the probability that BOTH show a ${s}?`, "1/36", ["1/6", "2/6", "1/12"], `P(first = ${s}) \u00D7 P(second = ${s}) = 1/6 \u00D7 1/6 = 1/36.`);
};

GEN.probability_simple = (rng) => {
  const bank = [
    { q: "a number greater than 4", a: "1/3", d: ["2/6", "1/6", "1/2"] },
    { q: "a prime number (2, 3 or 5)", a: "1/2", d: ["1/3", "2/6", "3/5"] },
    { q: "a multiple of 3", a: "1/3", d: ["1/2", "2/3", "1/6"] },
    { q: "a factor of 6", a: "2/3", d: ["1/2", "1/3", "4/5"] }
  ];
  const p = R.pick(rng, bank);
  return mcq(rng, `A fair 6-sided dice is rolled. What is the probability of ${p.q}? Give your answer in lowest terms.`, p.a, p.d, `Count the winning faces out of 6 and simplify \u2192 ${p.a}.`);
};

GEN.read_clock = (rng) => {
  const h1 = R.int(rng, 6, 10), m1 = R.pick(rng, [5, 10, 20, 25, 35, 40, 50, 55]), durM = R.int(rng, 1, 3) * 60 + R.pick(rng, [5, 15, 25, 35, 45, 50]);
  const end = h1 * 60 + m1 + durM, H = Math.floor(end / 60) % 24, M = end % 60, mm = String(m1).padStart(2, "0"), MM = String(M).padStart(2, "0");
  return mcq(rng, `A journey starts at ${h1}:${mm} and takes ${Math.floor(durM / 60)} h ${durM % 60} min. What time does it finish?`, `${H}:${MM}`, [`${(H + 1) % 24}:${MM}`, `${H}:${String((M + 30) % 60).padStart(2, "0")}`, `${(H + 2) % 24}:${MM}`], `Add ${Math.floor(durM / 60)} h ${durM % 60} min to ${h1}:${mm} \u2192 ${H}:${MM}.`);
};

GEN.time_hard = (rng) => {
  const t = R.int(rng, 0, 2), fmt = (x) => String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
  if (t === 0) { const s = R.int(rng, 6, 14) * 60 + R.pick(rng, [0, 15, 30, 45]), dur = R.int(rng, 60, 300), e = s + dur; return mcq(rng, `A train leaves at ${fmt(s)} and arrives at ${fmt(e)} (24-hour clock). How long is the journey?`, `${Math.floor(dur / 60)} h ${dur % 60} min`, [`${Math.floor(dur / 60) + 1} h ${dur % 60} min`, `${Math.floor(dur / 60)} h ${(dur % 60 + 15) % 60} min`, `${Math.ceil(dur / 60)} h`], `From ${fmt(s)} to ${fmt(e)} is ${Math.floor(dur / 60)} h ${dur % 60} min.`); }
  if (t === 1) { const a = R.int(rng, 20, 50), b = R.int(rng, 20, 50), c = R.int(rng, 20, 50), tot = a + b + c; return mcq(rng, `Three lessons last ${a} min, ${b} min and ${c} min. What is the total time?`, `${Math.floor(tot / 60)} h ${tot % 60} min`, [`${Math.floor(tot / 60)} h ${(tot % 60 + 10) % 60} min`, `${Math.ceil(tot / 60)} h`, `${Math.floor(tot / 60) + 1} h ${tot % 60} min`], `${a}+${b}+${c}=${tot} min = ${Math.floor(tot / 60)} h ${tot % 60} min.`); }
  const h = R.int(rng, 13, 23), m = R.pick(rng, [5, 17, 23, 41, 48]), h12 = h - 12, mm = String(m).padStart(2, "0");
  return mcq(rng, `Write ${h}:${mm} (24-hour clock) as a 12-hour time.`, `${h12}:${mm} pm`, [`${h}:${mm} am`, `${h12}:${mm} am`, `${h12 + 1}:${mm} pm`], `Subtract 12 and add pm: ${h12}:${mm} pm.`);
};

/* ---------------------------- ENGLISH --------------------------------- */
GEN.active_passive = (rng) => {
  const set = [["The manager will review the report.", "The report will be reviewed by the manager."], ["They are building a new stadium.", "A new stadium is being built by them."], ["Someone has stolen my bike.", "My bike has been stolen."], ["The teacher was marking the essays.", "The essays were being marked by the teacher."], ["We must obey the rules.", "The rules must be obeyed."], ["The storm had destroyed the crops.", "The crops had been destroyed by the storm."], ["Nobody can solve this puzzle.", "This puzzle cannot be solved."]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Rewrite in the PASSIVE voice, keeping the SAME tense:  "${p[0]}"`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `Keep the tense; object moves to the front + correct form of 'be' + past participle. \u2192 "${p[1]}"`);
};

GEN.direct_indirect = (rng) => {
  const set = [[`She asked, "Where are you going?"`, `She asked where I was going.`], [`He said, "Close the door."`, `He told me to close the door.`], [`"Did you finish the work?" she asked.`, `She asked whether I had finished the work.`], [`Mum said, "I will call you tomorrow."`, `Mum said that she would call me the next day.`], [`"Don't touch that," he warned.`, `He warned me not to touch that.`], [`They asked, "Can we leave now?"`, `They asked if they could leave then.`]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Choose the correct reported (indirect) speech:   ${p[0]}`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `Shift the tense back, change pronouns and time words (tomorrow \u2192 the next day, now \u2192 then). \u2192 ${p[1]}`);
};

GEN.tense_hard = (rng) => {
  const set = [
    { s: "If I ___ known, I would have helped.", a: "had", d: ["have", "would", "was"] },
    { s: "By next June she ___ here for ten years.", a: "will have worked", d: ["will work", "has worked", "is working"] },
    { s: "They wish they ___ more time yesterday.", a: "had had", d: ["have had", "had", "would have"] },
    { s: "He ___ for two hours when the bus finally came.", a: "had been waiting", d: ["was waiting", "has waited", "waited"] },
    { s: "No sooner ___ we arrived than it started to rain.", a: "had", d: ["have", "did", "were"] },
    { s: "Look at those clouds \u2014 it ___ to rain.", a: "is going", d: ["goes", "will go", "has gone"] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct verb form:  "${p.s}"`, p.a, p.d, `Correct: "${p.a}".`);
};

GEN.punctuation_hard = (rng) => {
  const set = [
    { q: "Which sentence is punctuated correctly?", a: `My best friend, who lives in Cairo, is visiting; she arrives on Friday.`, d: [`My best friend who lives in Cairo, is visiting, she arrives on Friday.`, `My best friend, who lives in Cairo is visiting; she arrives on Friday.`, `My best friend who lives in Cairo is visiting she arrives on Friday.`] },
    { q: "Which sentence uses the colon correctly?", a: `The recipe needs three things: flour, eggs and milk.`, d: [`The recipe needs three things; flour, eggs and milk.`, `The recipe needs: three things flour, eggs and milk.`, `The recipe needs three things, flour, eggs and milk.`] },
    { q: "Which sentence is punctuated correctly?", a: `"I can't believe it!" she exclaimed. "We've won!"`, d: [`"I can't believe it! she exclaimed. We've won!"`, `"I can't believe it!" she exclaimed "we've won!"`, `"I cant believe it!" she exclaimed. "Weve won!"`] },
    { q: "Which sentence uses the semicolon correctly?", a: `Some people write with a pen; others prefer a pencil.`, d: [`Some people write with a pen, others prefer a pencil.`, `Some people write with a pen; and others prefer a pencil.`, `Some people write with a pen: others prefer a pencil.`] }
  ];
  const p = R.pick(rng, set);
  return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}`);
};

GEN.question_tag = (rng) => {
  const set = [["I am late,", "aren't I?"], ["Let's go,", "shall we?"], ["Open the window,", "will you?"], ["Nobody phoned,", "did they?"], ["Everyone enjoyed it,", "didn't they?"], ["There's a problem,", "isn't there?"], ["He hardly ever calls,", "does he?"], ["You'd better hurry,", "hadn't you?"]];
  const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
  return mcq(rng, `Add the correct question tag:  "${p[0]} ___"`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `Watch the tricky cases (I am \u2192 aren't I; Let's \u2192 shall we; 'nobody'/'hardly' act negative). \u2192 "${p[0]} ${p[1]}"`);
};

GEN.parts_of_speech = (rng) => {
  const set = [["We will water the plants.", "water", "Verb"], ["The water is cold.", "water", "Noun"], ["Turn left at the corner.", "left", "Adverb"], ["He hurt his left hand.", "left", "Adjective"], ["They book tickets online.", "book", "Verb"], ["I read a good book.", "book", "Noun"], ["She sang beautifully.", "beautifully", "Adverb"], ["He sat near the fire.", "near", "Preposition"], ["Although it rained, we played.", "Although", "Conjunction"], ["Wow, what a goal!", "Wow", "Interjection"]];
  const p = R.pick(rng, set), all = ["Noun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Interjection", "Pronoun"];
  return mcq(rng, `In the sentence "${p[0]}", what part of speech is the word "${p[1]}"?`, p[2], R.shuffle(rng, all.filter(x => x !== p[2])).slice(0, 3), `Here "${p[1]}" works as a ${p[2].toLowerCase()}.`);
};

GEN.degrees_comparison = (rng) => {
  if (rng() < 0.5) {
    const set = [["He is more taller than me.", "He is taller than me."], ["This is the most easiest question.", "This is the easiest question."], ["She runs more faster than him.", "She runs faster than him."], ["It was the worse day ever.", "It was the worst day ever."], ["He is gooder at maths than me.", "He is better at maths than me."]];
    const p = R.pick(rng, set), wrongs = set.filter(x => x[1] !== p[1]).map(x => x[1]);
    return mcq(rng, `Choose the CORRECT version of:  "${p[0]}"`, p[1], R.shuffle(rng, wrongs).slice(0, 3), `Never double up (more + -er) and use irregular forms. \u2192 "${p[1]}"`);
  }
  const set = [["little (amount)", "less", "least"], ["good", "better", "best"], ["bad", "worse", "worst"], ["far", "farther", "farthest"], ["many", "more", "most"]];
  const p = R.pick(rng, set), which = R.int(rng, 1, 2), label = which === 1 ? "comparative" : "superlative", ans = p[which];
  const wrongs = [p[which === 1 ? 2 : 1], p[0] + "er", p[0] + "est"].filter(x => x !== ans);
  return mcq(rng, `Give the ${label} form of "${p[0]}".`, ans, wrongs.slice(0, 3), `"${p[0]}" is irregular: comparative "${p[1]}", superlative "${p[2]}".`);
};

GEN.articles = (rng) => {
  const set = [["We climbed ___ Alps last summer.", "the"], ["___ honesty is the best policy.", "(no article)"], ["She plays ___ violin beautifully.", "the"], ["He is ___ MP for our town.", "an"], ["They sent him to ___ prison for a year.", "(no article)"], ["I saw ___ unicorn in the story.", "a"], ["___ Everest is the tallest mountain.", "(no article)"], ["What ___ interesting idea!", "an"]];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct article (or 'no article'):  "${p[0]}"`, p[1], ["a", "an", "the", "(no article)"].filter(x => x !== p[1]).slice(0, 3), `Correct: ${p[1] === "(no article)" ? "no article is needed" : `"${p[1]}"`}. Abstract nouns, most single mountains and 'go to prison' take no article.`);
};

GEN.vocab_hard = (rng) => {
  const t = R.int(rng, 0, 3);
  if (t === 0) { const set = [["benevolent", "kind", "cruel", "confused", "tiny"], ["diligent", "hard-working", "lazy", "cheerful", "noisy"], ["candid", "honest", "secretive", "clumsy", "brave"], ["meticulous", "very careful", "careless", "angry", "generous"], ["abundant", "plentiful", "scarce", "heavy", "quiet"], ["reluctant", "unwilling", "eager", "tired", "proud"]]; const p = R.pick(rng, set); return mcq(rng, `Choose the word closest in meaning to "${p[0]}".`, p[1], [p[2], p[3], p[4]], `"${p[0]}" means "${p[1]}".`); }
  if (t === 1) { const bank = [["frequently", "rarely"], ["ancient", "modern"], ["expand", "shrink"], ["generous", "selfish"], ["temporary", "permanent"], ["increase", "decrease"]]; const p = R.pick(rng, bank), others = bank.filter(x => x[0] !== p[0]).map(x => x[1]); return mcq(rng, `Choose the ANTONYM (opposite) of "${p[0]}".`, p[1], R.shuffle(rng, others).slice(0, 3), `The opposite of "${p[0]}" is "${p[1]}".`); }
  if (t === 2) { const set = [["tele", "television, telephone", "far off"], ["aqua", "aquarium, aquatic", "water"], ["bio", "biology, biography", "life"], ["geo", "geography, geology", "the earth"], ["port", "transport, portable", "to carry"], ["dict", "dictate, predict", "to say"]]; const p = R.pick(rng, set); return mcq(rng, `The root "${p[0]}" (as in ${p[1]}) means...`, p[2], ["a colour", "a number", "a sound"].slice(0, 3), `The root "${p[0]}" means "${p[2]}".`); }
  const set = [["bite the bullet", "face something difficult bravely"], ["the last straw", "the final problem that makes you give up"], ["cost an arm and a leg", "be very expensive"], ["on thin ice", "in a risky situation"], ["read between the lines", "find a hidden meaning"], ["the ball is in your court", "it is your turn to act or decide"]];
  const p = R.pick(rng, set);
  return mcq(rng, `What does the idiom "${p[0]}" mean?`, p[1], ["a type of sport", "a kind of weather", "a cooking method"], `"${p[0]}" means to ${p[1]}.`);
};

GEN.subject_verb = (rng) => {
  const set = [["Neither of the boys ___ ready.", "is", ["are", "were", "be"]], ["The team ___ winning every match this season.", "is", ["are", "were", "been"]], ["Each of the students ___ a book.", "has", ["have", "having", "are"]], ["Mathematics ___ my favourite subject.", "is", ["are", "were", "be"]], ["There ___ several reasons for this.", "are", ["is", "was", "be"]], ["Neither the teacher nor the pupils ___ happy.", "are", ["is", "was", "has"]], ["The news ___ very surprising.", "is", ["are", "were", "have"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct verb:  "${p[0]}"`, p[1], p[2], `Correct: "${p[1]}".`);
};

GEN.apostrophe = (rng) => {
  const set = [["the toys belonging to the children", "the children's toys", ["the childrens' toys", "the childrens toys", "the children's toy's"]], ["the changing rooms for the ladies", "the ladies' changing rooms", ["the ladie's changing rooms", "the ladies changing room's", "the lady's changing rooms"]], ["the office of the boss", "the boss's office", ["the bosses office", "the boss' office's", "the bosses' office"]], ["the books of the two teachers", "the two teachers' books", ["the two teacher's books", "the two teachers books", "the two teachers's books"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Which is written correctly for: ${p[0]}?`, p[1], p[2], `Correct: ${p[1]}.`);
};

GEN.sentence_order = (rng) => {
  const set = [
    ["First, preheat the oven.", "Next, mix the flour and sugar.", "Then pour the mixture into a tin.", "Finally, bake for twenty minutes."],
    ["Long ago, a poor farmer found a golden egg.", "At first, he could not believe his luck.", "Soon, he grew greedy and wanted more.", "In the end, he lost everything."],
    ["The alarm rang loudly at six.", "Yawning, Omar climbed out of bed.", "After a quick breakfast, he grabbed his bag.", "He just caught the bus as it pulled away."]
  ];
  const p = R.pick(rng, set), correct = p.join(" ");
  const sw = (i, j) => { const a = p.slice();[a[i], a[j]] = [a[j], a[i]]; return a.join(" "); };
  return mcq(rng, `Put these sentences in the best order:\n\u2022 ${R.shuffle(rng, p).join("\n\u2022 ")}\n\nWhich order is correct?`, correct, [sw(0, 1), sw(2, 3), sw(0, 3)], `Use the time words (First, Next, Then, Finally) and the logic of what happens.`);
};

GEN.spelling_choose = (rng) => {
  const set = [["nec___ary", "ess", ["es", "essi", "as"]], ["defin___ly", "ite", ["ate", "it", "itly"]], ["sep___ate", "ar", ["er", "ir", "or"]], ["embarr___", "ass", ["as", "ess", "iss"]], ["occ___ion", "as", ["ass", "ac", "es"]], ["priv___ge", "ile", ["ele", "ila", "elo"]], ["rhy___m", "th", ["thm", "tm", "them"]], ["consci___", "ous", ["ious", "us", "ent"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Complete the spelling correctly:  ${p[0].replace("___", "____")}`, p[1], p[2], `The correct spelling is "${p[0].replace("___", p[1])}".`);
};

GEN.homophone = (rng) => {
  const set = [["The knight rode his horse ___ the castle.", "to", ["too", "two", "tow"]], ["They left ___ coats over ___.", "their / there", ["there / their", "they're / their", "their / they're"]], ["The weather will ___ affect the trip.", "definitely", ["defiantly", "definately", "defintly"]], ["I could not ___ the loud music.", "bear", ["bare", "bair", "bere"]], ["Please give me a ___ of advice.", "piece", ["peace", "peece", "peic"]], ["The team lost ___ their star player was injured.", "because", ["becuase", "becouse", "bcause"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `Choose the correct word(s):  "${p[0]}"`, p[1], p[2], `The correct choice is "${p[1]}".`);
};

GEN.plural_form = (rng) => {
  const set = [["knife", "knives", ["knifes", "knifves", "knife's"]], ["potato", "potatoes", ["potatos", "potatoe", "potato's"]], ["child", "children", ["childs", "childrens", "childes"]], ["mouse", "mice", ["mouses", "mices", "mouse's"]], ["leaf", "leaves", ["leafs", "leafes", "leave"]], ["crisis", "crises", ["crisises", "crisiss", "crisi"]], ["cactus", "cacti", ["cactuses", "cactus's", "cactusi"]], ["woman", "women", ["womans", "womens", "womin"]]];
  const p = R.pick(rng, set);
  return mcq(rng, `What is the correct plural of "${p[0]}"?`, p[1], p[2], `The plural of "${p[0]}" is "${p[1]}".`);
};

/* ---------------------------- SCIENCE --------------------------------- */
GEN.biology_facts = (rng) => {
  const set = [
    { q: "Which blood vessels carry blood AWAY from the heart?", a: "Arteries", d: ["Veins", "Capillaries", "Nerves"] },
    { q: "In which organ does gas exchange (oxygen in, carbon dioxide out) happen?", a: "The lungs", d: ["The stomach", "The liver", "The kidneys"] },
    { q: "Which part of a plant takes in water and minerals from the soil?", a: "The roots", d: ["The leaves", "The flower", "The stem"] },
    { q: "What is produced when we breathe out?", a: "Carbon dioxide and water vapour", d: ["Oxygen", "Nitrogen only", "Glucose"] },
    { q: "Which organ removes waste and makes urine?", a: "The kidney", d: ["The heart", "The lung", "The liver"] },
    { q: "Insects that move pollen between flowers are called...", a: "Pollinators", d: ["Predators", "Decomposers", "Producers"] },
    { q: "Which food group gives us the quickest source of energy?", a: "Carbohydrates", d: ["Proteins", "Vitamins", "Fibre"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.food_chain = (rng) => {
  const set = [
    { q: "In the food chain  grass \u2192 grasshopper \u2192 frog \u2192 snake, what is the frog?", a: "A secondary consumer (and prey for the snake)", d: ["A producer", "A primary consumer", "A decomposer"] },
    { q: "If all the grass in  grass \u2192 rabbit \u2192 fox  died, what happens FIRST?", a: "The rabbit population falls", d: ["The fox population rises", "Nothing changes", "More grass grows"] },
    { q: "What do the ARROWS in a food chain show?", a: "The direction energy flows (eaten \u2192 eater)", d: ["Which animal is bigger", "The order of size", "Who is fastest"] },
    { q: "In any food chain, where does the energy originally come from?", a: "The Sun", d: ["The soil", "The water", "The predators"] },
    { q: "An organism that eats both plants and animals is a...", a: "Omnivore", d: ["Herbivore", "Carnivore", "Producer"] },
    { q: "Which organisms return nutrients to the soil by breaking down dead matter?", a: "Decomposers", d: ["Producers", "Predators", "Prey"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.ecosystem_roles = (rng) => {
  const set = [
    { q: "Green plants are called producers because they...", a: "make their own food by photosynthesis", d: ["eat other animals", "break down dead things", "hunt for prey"] },
    { q: "A hawk that hunts mice is best described as a...", a: "Predator", d: ["Producer", "Prey", "Decomposer"] },
    { q: "If the number of foxes (predators) suddenly rose, the number of rabbits (prey) would probably...", a: "fall", d: ["rise", "stay exactly the same", "become producers"] },
    { q: "Why can a food WEB show an ecosystem better than a single food chain?", a: "It shows that animals eat several different things", d: ["It uses more arrows for decoration", "It is always shorter", "It only shows plants"] },
    { q: "A habitat provides an organism with...", a: "food, water and shelter", d: ["only sunlight", "only predators", "only oxygen"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.body_systems = (rng) => {
  const set = [
    { q: "Which system works with the heart to carry oxygen around the body?", a: "The circulatory (blood) system", d: ["The digestive system", "The skeletal system", "The nervous system"] },
    { q: "The diaphragm is a muscle used mainly for...", a: "breathing", d: ["digesting food", "pumping blood", "thinking"] },
    { q: "Which system breaks food down so nutrients can be absorbed?", a: "The digestive system", d: ["The respiratory system", "The skeletal system", "The circulatory system"] },
    { q: "Why must the skeleton have joints?", a: "So the body can bend and move", d: ["To make us taller only", "To store food", "To pump blood"] },
    { q: "Which system carries messages between the brain and the body?", a: "The nervous system", d: ["The digestive system", "The circulatory system", "The muscular system"] },
    { q: "Muscles usually work in pairs because a muscle can only...", a: "pull, not push", d: ["push, not pull", "grow, not shrink", "bend bones"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.life_processes = (rng) => {
  const set = [
    { q: "A scientist finds an object that moves and uses energy but never grows or reproduces. Is it alive?", a: "No \u2014 it must do ALL seven life processes", d: ["Yes, because it moves", "Yes, because it uses energy", "Only if it is warm"] },
    { q: "Which life process is a plant carrying out when it turns to face the Sun?", a: "Sensitivity", d: ["Excretion", "Reproduction", "Digestion"] },
    { q: "'Respiration' as a life process means...", a: "releasing energy from food inside cells", d: ["only breathing in and out", "getting rid of waste", "growing bigger"] },
    { q: "Getting rid of waste products made by the body is called...", a: "Excretion", d: ["Nutrition", "Respiration", "Reproduction"] },
    { q: "Which pair of life processes both help a species SURVIVE over time?", a: "Reproduction and nutrition", d: ["Movement and excretion", "Sensitivity and respiration", "Growth and movement"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.life_process_scenario = (rng) => {
  const set = [
    ["A plant's roots grow downwards towards water.", "Sensitivity"],
    ["A cat has a litter of kittens.", "Reproduction"],
    ["A seedling gets taller each week.", "Growth"],
    ["You sweat on a hot day.", "Excretion"],
    ["A dog pants and its muscles release energy to run.", "Respiration"],
    ["A Venus flytrap snaps shut when a fly lands.", "Sensitivity"],
    ["A tree takes in carbon dioxide and makes glucose.", "Nutrition"]
  ];
  const p = R.pick(rng, set), all = ["Movement", "Respiration", "Sensitivity", "Growth", "Reproduction", "Excretion", "Nutrition"];
  return mcq(rng, `Which life process is shown here?  "${p[0]}"`, p[1], R.shuffle(rng, all.filter(x => x !== p[1])).slice(0, 3), `${p[0]} \u2014 this is ${p[1]}.`);
};

GEN.fair_test = (rng) => {
  const set = [
    { q: "You test how far a toy car rolls from different ramp heights. What should you CHANGE?", a: "The height of the ramp", d: ["The car you use", "The floor surface", "The ramp length"] },
    { q: "In that ramp experiment, which is the thing you MEASURE (the outcome)?", a: "The distance the car rolls", d: ["The ramp height", "The colour of the car", "The time of day"] },
    { q: "Why do scientists repeat measurements and take an average?", a: "To make results more reliable and reduce error", d: ["To use more paper", "To make it take longer", "To change the answer"] },
    { q: "In a fair test, the variables you keep the same are called the...", a: "control variables", d: ["independent variable", "dependent variable", "conclusion"] },
    { q: "To test which fertiliser grows the tallest plant, what must stay the same?", a: "Water, light and pot size", d: ["The type of fertiliser", "Nothing at all", "The height measured"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.fair_test_scenario = (rng) => {
  const set = [
    { q: "Investigation: does water temperature affect how fast sugar dissolves? The INDEPENDENT variable (what you change) is...", a: "the water temperature", d: ["how fast it dissolves", "the amount of sugar", "the size of the cup"] },
    { q: "In that same test, the DEPENDENT variable (what you measure) is...", a: "the time taken to dissolve", d: ["the water temperature", "the type of sugar", "the stirring"] },
    { q: "A pupil tests plant growth in light and dark but also gives the dark plant less water. Why is the test NOT fair?", a: "Two variables were changed, so you can't tell which caused the result", d: ["Plants don't need light", "The test took too long", "Dark plants grow faster"] },
    { q: "Which result is the most RELIABLE?", a: "One repeated three times with similar readings", d: ["A single reading", "A reading nobody wrote down", "A guess"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.scientific_method = (rng) => {
  const set = [
    { q: "A 'prediction' in an experiment is best described as...", a: "what you think will happen, and why, before you test", d: ["the equipment list", "the final result", "a random guess with no reason"] },
    { q: "Your results do NOT match your prediction. What should a good scientist do?", a: "Report the real results honestly and try to explain them", d: ["Change the results to match", "Hide the experiment", "Ignore the results"] },
    { q: "Which is a CONCLUSION rather than just a result?", a: "'The higher the ramp, the further the car rolled, because it gained more speed.'", d: ["'The car rolled 40 cm.'", "'We used a ramp.'", "'The car was red.'"] },
    { q: "Data that is written as numbers you can measure is called...", a: "quantitative data", d: ["an opinion", "a prediction", "a variable"] },
    { q: "Putting results in a table or graph mainly helps you to...", a: "spot patterns and trends", d: ["use more colours", "make it longer", "avoid conclusions"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.solar_system = (rng) => {
  const set = [
    { q: "Why do we have day and night?", a: "The Earth spins (rotates) once every 24 hours", d: ["The Sun switches off", "The Earth orbits the Sun once a day", "The Moon blocks the Sun"] },
    { q: "Why does a year last about 365 days?", a: "That is how long Earth takes to orbit the Sun once", d: ["Earth spins 365 times a day", "The Moon orbits Earth once", "The Sun orbits Earth"] },
    { q: "Which correctly lists the first four planets from the Sun?", a: "Mercury, Venus, Earth, Mars", d: ["Venus, Earth, Mars, Mercury", "Earth, Mars, Mercury, Venus", "Mars, Earth, Venus, Mercury"] },
    { q: "The Moon appears to shine because it...", a: "reflects light from the Sun", d: ["makes its own light", "is a small star", "is on fire"] },
    { q: "Why does the Sun look bigger and brighter than other stars?", a: "It is much closer to Earth", d: ["It is the biggest star", "It is the hottest star", "Other stars are switched off"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.space_physics_facts = (rng) => {
  const set = [
    { q: "What keeps the planets moving in orbit around the Sun?", a: "Gravity", d: ["Magnetism", "Friction", "Air pressure"] },
    { q: "A shadow is formed because light...", a: "travels in straight lines and is blocked by an object", d: ["bends around objects", "is made by the object", "disappears at night"] },
    { q: "Where would an astronaut weigh the LEAST?", a: "On the Moon (weaker gravity)", d: ["On Earth", "At the bottom of the sea", "On a mountain"] },
    { q: "As the Earth rotates, a shadow from a stick will...", a: "change length and direction through the day", d: ["stay exactly the same", "disappear at noon", "point the same way all day"] },
    { q: "Gravity on the Moon is about one sixth of Earth's. A 60 N weight on Earth would be about ___ on the Moon.", a: "10 N", d: ["60 N", "360 N", "6 N"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.circuits = (rng) => {
  const set = [
    { q: "In a SERIES circuit, if you add another bulb, the bulbs will...", a: "get dimmer", d: ["get brighter", "stay exactly the same", "switch off completely"] },
    { q: "Why does a circuit stop working if there is a break in the wire?", a: "The current needs a complete loop to flow", d: ["The battery runs out instantly", "The bulb melts", "Electricity leaks out"] },
    { q: "Which material would you use to make the wires in a circuit?", a: "Copper (a conductor)", d: ["Plastic", "Rubber", "Wood"] },
    { q: "Adding a second cell (battery) the correct way round will make a bulb...", a: "brighter", d: ["dimmer", "go out", "change colour"] },
    { q: "What is the job of a switch in a circuit?", a: "To make or break the loop to turn things on/off", d: ["To store electricity", "To make more current", "To measure voltage"] },
    { q: "Which of these is an insulator (does NOT let current pass)?", a: "Rubber", d: ["Iron", "Copper", "Steel"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.cells = (rng) => {
  const set = [
    { q: "Which part controls what enters and leaves an animal cell?", a: "The cell membrane", d: ["The nucleus", "The cytoplasm", "The cell wall"] },
    { q: "A plant cell has a chloroplast but an animal cell does not. Why?", a: "Only plant cells photosynthesise to make food", d: ["Animal cells are bigger", "Animal cells have no nucleus", "Plant cells cannot move"] },
    { q: "Which THREE parts are found in BOTH plant and animal cells?", a: "Nucleus, cytoplasm and cell membrane", d: ["Cell wall, chloroplast and nucleus", "Chloroplast, vacuole and cell wall", "Cell wall, membrane and chloroplast"] },
    { q: "The nucleus is often called the 'control centre' because it...", a: "contains the instructions (genes) for the cell", d: ["makes energy", "stores water", "gives the cell its shape"] },
    { q: "A large permanent vacuole full of sap is a feature of...", a: "plant cells", d: ["animal cells", "all cells equally", "only red blood cells"] },
    { q: "Why do many similar cells group together to form a tissue?", a: "To carry out the same job more effectively", d: ["To make the organism smaller", "So each cell can be different", "To stop growth"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.photosynthesis = (rng) => {
  const set = [
    { q: "Which word equation correctly summarises photosynthesis?", a: "carbon dioxide + water \u2192 glucose + oxygen", d: ["glucose + oxygen \u2192 carbon dioxide + water", "oxygen + water \u2192 glucose + carbon dioxide", "carbon dioxide + oxygen \u2192 glucose + water"] },
    { q: "A plant is kept in the dark for a week. What is most likely to happen and why?", a: "It weakens, because without light it cannot make food", d: ["It grows faster to find light", "Nothing, plants don't need light", "It makes more oxygen"] },
    { q: "Which gas do plants TAKE IN for photosynthesis?", a: "Carbon dioxide", d: ["Oxygen", "Nitrogen", "Hydrogen"] },
    { q: "Photosynthesis mainly happens in the leaves because they...", a: "contain the most chloroplasts and catch the most light", d: ["are the heaviest part", "have no water", "are underground"] },
    { q: "What is the MAIN purpose of the glucose a plant makes?", a: "To provide energy and material for growth", d: ["To colour the flowers", "To attract rain", "To cool the plant"] },
    { q: "Which factor would SPEED UP photosynthesis?", a: "More light and more carbon dioxide", d: ["Total darkness", "Removing all water", "Colder temperatures only"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.measurement = (rng) => {
  const t = R.int(rng, 0, 2);
  if (t === 0) { const m = R.int(rng, 12, 90) / 10, cm = m * 100; return mcqNum(rng, `Convert ${m} metres into centimetres.`, cm, [m * 10, m * 1000, cm + 10, m + 100], `1 m = 100 cm, so ${m} \u00D7 100 = ${cm} cm.`); }
  if (t === 1) { const g = R.int(rng, 250, 950); return mcq(rng, `A jug holds ${g} ml of juice. How is this written in litres?`, `${(g / 1000).toFixed(3)} l`, [`${g * 1000} l`, `${(g / 100).toFixed(2)} l`, `${g} l`], `1 litre = 1000 ml, so ${g} ml = ${(g / 1000).toFixed(3)} l.`); }
  const items = [["the mass of an apple", "grams", ["kilometres", "litres", "seconds"]], ["the length of a football pitch", "metres", ["millilitres", "grams", "degrees"]], ["the volume of water in a bottle", "millilitres", ["metres", "grams", "hours"]], ["the temperature of a room", "degrees Celsius", ["grams", "metres", "litres"]]];
  const p = R.pick(rng, items);
  return mcq(rng, `Which unit is most sensible for measuring ${p[0]}?`, p[1], p[2], `The best unit is ${p[1]}.`);
};

GEN.phys_chem_change = (rng) => {
  const set = [
    ["Ice melting into water", "Physical", "it can be reversed and no new substance is made"],
    ["Wood burning to ash and smoke", "Chemical", "a new substance forms and it cannot easily be reversed"],
    ["Dissolving sugar in tea", "Physical", "the sugar is still there and could be recovered"],
    ["An iron nail rusting", "Chemical", "a new substance (rust) is made"],
    ["Baking a cake", "Chemical", "new substances form and it cannot be undone"],
    ["Boiling water into steam", "Physical", "only the state changes and it can be reversed"],
    ["Milk turning sour", "Chemical", "a new substance forms"],
    ["Cutting paper into pieces", "Physical", "it is still paper, only the shape changed"]
  ];
  const p = R.pick(rng, set);
  return mcq(rng, `Is this a PHYSICAL or CHEMICAL change:  "${p[0]}"?`, p[1], p[1] === "Physical" ? ["Chemical", "Neither", "Both at once"] : ["Physical", "Neither", "Both at once"], `${p[1]} change \u2014 ${p[2]}.`);
};

GEN.elements_compounds = (rng) => {
  const set = [
    { q: "Which of these is a COMPOUND (two or more elements chemically joined)?", a: "Water (H\u2082O)", d: ["Oxygen", "Iron", "Gold"] },
    { q: "Which is an ELEMENT \u2014 a substance made of only one kind of atom?", a: "Copper", d: ["Salt", "Water", "Carbon dioxide"] },
    { q: "A mixture is different from a compound because a mixture...", a: "can be separated without a chemical reaction", d: ["is always a liquid", "has only one element", "cannot be separated"] },
    { q: "Air is best described as a...", a: "mixture of gases", d: ["single element", "compound", "pure substance"] },
    { q: "Which method separates salt from salty water?", a: "Evaporation", d: ["Filtering", "Magnetism", "Freezing only"] },
    { q: "Which method would separate sand from water?", a: "Filtering", d: ["Evaporation", "Magnetism", "Melting"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.forces_machines = (rng) => {
  const set = [
    { q: "A book rests on a table without moving. What can you say about the forces on it?", a: "They are balanced (equal and opposite)", d: ["There are no forces", "Gravity is switched off", "The forces are unbalanced"] },
    { q: "Which force slows a bike down when you stop pedalling on a flat road?", a: "Friction (and air resistance)", d: ["Gravity pulling it back", "Magnetism", "Upthrust"] },
    { q: "A parachute works because it increases...", a: "air resistance, slowing the fall", d: ["gravity", "the person's weight", "friction with the ground"] },
    { q: "Unbalanced forces on a moving object will change its...", a: "speed or direction", d: ["colour", "mass", "temperature"] },
    { q: "Why is it easier to lift a heavy load using a lever?", a: "The lever lets a smaller force do the same job", d: ["It removes gravity", "It makes the load lighter", "It adds friction"] },
    { q: "A heavy box is hard to push because of the force of...", a: "friction between the box and the floor", d: ["upthrust", "magnetism", "air resistance only"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.magnetism = (rng) => {
  const set = [
    { q: "Two NORTH poles of magnets are brought together. What happens?", a: "They repel (push apart)", d: ["They attract", "Nothing happens", "They stick and stay"] },
    { q: "Which material would a magnet attract?", a: "An iron nail", d: ["A plastic ruler", "A copper coin", "A wooden block"] },
    { q: "A magnet can pick up a paperclip through a thin sheet of paper. This shows that...", a: "a magnetic field can act through some materials", d: ["paper is magnetic", "the magnet touches the clip", "gravity pulls the clip"] },
    { q: "Where is a bar magnet's pull STRONGEST?", a: "At the poles (the ends)", d: ["In the middle", "It is equal everywhere", "Just off the surface"] },
    { q: "Which is NOT attracted to a magnet?", a: "Aluminium", d: ["Iron", "Steel", "Nickel"] },
    { q: "A compass needle points north because...", a: "the Earth acts like a giant magnet", d: ["north is uphill", "the Sun pulls it", "it is heaviest at that end"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

GEN.energy_forms = (rng) => {
  const set = [
    { q: "When you switch on a torch, energy is mainly transferred from chemical (battery) to...", a: "light and thermal (heat) energy", d: ["sound and nuclear energy", "kinetic and gravity energy", "elastic energy only"] },
    { q: "A stretched rubber band stores which type of energy?", a: "Elastic (strain) energy", d: ["Chemical energy", "Light energy", "Sound energy"] },
    { q: "A moving car has kinetic energy. Where did most of this energy come from?", a: "Chemical energy in the fuel", d: ["Light from the Sun directly", "Sound from the engine", "The colour of the car"] },
    { q: "Which is a RENEWABLE energy resource?", a: "Wind", d: ["Coal", "Oil", "Natural gas"] },
    { q: "A ball is held high up. As it falls, its energy changes from gravitational potential to...", a: "kinetic energy", d: ["chemical energy", "elastic energy", "light energy"] },
    { q: "Energy cannot be created or destroyed \u2014 it is only...", a: "transferred from one form to another", d: ["used up and gone", "made by machines", "turned into matter"] }
  ];
  const p = R.pick(rng, set); return mcq(rng, p.q, p.a, p.d, `Correct: ${p.a}.`);
};

/* ---- public API used by app.js ---------------------------------------- */
window.ContentEngine = {
  makeRng,
  has: (k) => typeof GEN[k] === "function",
  generate: (keys, count, seed) => {
    const rng = makeRng(seed);
    const items = [];
    const seen = new Set();
    const sigOf = (it) => it.q + "||" + (it._fill ? it.answer : (it.choices ? it.choices[it.answer] : ""));
    let guard = 0;
    // First pass: only unique (question stem + correct answer) items
    while (items.length < count && guard < count * 60) {
      guard++;
      const key = keys[Math.floor(rng() * keys.length)];
      if (!GEN[key]) continue;
      const it = GEN[key](rng);
      const sig = sigOf(it);
      if (seen.has(sig)) continue;
      seen.add(sig);
      it._gen = key;
      items.push(it);
    }
    // Safety top-up: if the pool is small, allow repeats so a quiz is never short
    guard = 0;
    while (items.length < count && guard < count * 60) {
      guard++;
      const key = keys[Math.floor(rng() * keys.length)];
      if (!GEN[key]) continue;
      const it = GEN[key](rng);
      it._gen = key;
      items.push(it);
    }
    return items;
  },
  isProject: (keys) => keys.length === 1 && (keys[0] === "creative_prompt" || keys[0] === "review_prompt")
};
