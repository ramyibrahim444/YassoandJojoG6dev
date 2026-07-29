/* ============================================================================
 * lessons.js  —  "Learn" content, keyed by  subject:area  (development area).
 * Both boys share a topic's lesson when they are developing the same area,
 * but each child only ever sees the topics in THEIR plan.
 * ==========================================================================*/
window.LESSONS = {

  /* =============================== MATHS ================================ */
  "math:stats": { html: `
    <p><b>Statistics</b> is about reading and summarising data (numbers we collect).</p>
    <ul>
      <li><b>Mean</b> = add them all up, then divide by how many there are.</li>
      <li><b>Median</b> = put the numbers <i>in order</i>, then take the middle one.</li>
      <li><b>Mode</b> = the value that appears <i>most often</i>.</li>
      <li><b>Range</b> = biggest − smallest (how spread out the data is).</li>
    </ul>
    <p>On a <b>graph</b>, always check what each square or symbol is worth before you read a value. To compare two bars, subtract the smaller from the bigger.</p>
    <p>Memory tip: <b>M</b>ode = <b>M</b>ost · Me<b>d</b>ian = mi<b>d</b>dle · Mean = "share it out fairly".</p>` },

  "math:frac": { html: `
    <p><b>Fractions, decimals and percentages</b> are three ways of writing the same amount.</p>
    <ul>
      <li>½ = 0.5 = 50%   ·   ¼ = 0.25 = 25%   ·   ¾ = 0.75 = 75%</li>
      <li>To turn a fraction into a decimal: divide top ÷ bottom.</li>
      <li>To turn a decimal into a percent: × 100 (move the point 2 places right).</li>
      <li><b>Simplify</b> a fraction by dividing top and bottom by the same number.</li>
    </ul>
    <p>To find a fraction OR percent <i>of</i> an amount, work out one part first, then multiply. E.g. 25% of 40 → 40 ÷ 4 = 10.</p>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li><b>Decimals:</b> line up the decimal points when adding/subtracting; when multiplying, count the decimal places and put the same number in the answer.</li>
      <li><b>Percentage increase:</b> find the % part, then <i>add</i> it. Decrease → <i>subtract</i> it. E.g. 200 up 15% → 15% of 200 = 30 → 230.</li>
      <li><b>Ratio sharing:</b> add the ratio parts, divide the total by that to get one part, then multiply. Share 40 in 3:5 → 8 parts → one part = 5 → 15 and 25.</li>
    </ul>` },

  "math:prob": { html: `
    <p><b>Probability</b> is how likely something is, from <b>0</b> (impossible) to <b>1</b> (certain). ½ means an even chance.</p>
    <ul>
      <li>Probability = <b>(ways to win) ÷ (total possible outcomes)</b>.</li>
      <li>A fair coin: P(heads) = 1 out of 2 = ½.</li>
      <li>One dice: P(rolling a 4) = 1 out of 6.</li>
    </ul>
    <p>Write it as a fraction first, then you can turn it into a decimal or percent if needed.</p>
    <p><b>Grade 6 stretch:</b> for a bag of counters, P(colour) = counters of that colour ÷ total counters, written in its <b>lowest terms</b>. P(<i>not</i> an event) = 1 − P(event). E.g. a dice: P(not 3) = 5/6.</p>` },

  "math:time": { html: `
    <p><b>Telling the time</b> on a clock:</p>
    <ul>
      <li>The <b>short hand</b> shows the hour, the <b>long hand</b> shows the minutes.</li>
      <li>Each number the long hand passes = 5 minutes (12→1 is 5 mins).</li>
      <li>"Quarter past" = 15 mins · "half past" = 30 mins · "quarter to" = 45 mins.</li>
      <li>24-hour clock: after midday add 12 (2 pm = 14:00).</li>
    </ul>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li><b>24-hour → 12-hour:</b> if the hour is 13 or more, subtract 12 and add "pm" (17:30 → 5:30 pm).</li>
      <li><b>Durations:</b> add the hours and minutes on separately; if minutes reach 60, carry 1 hour. A film at 2:40 lasting 1 h 45 min ends at 4:25.</li>
      <li>1 hour = 60 minutes, so hours × 60 = minutes.</li>
    </ul>` },

  "math:challenge": { html: `
    <p><b>Problem-solving</b> is about choosing the right steps for a word problem.</p>
    <ol>
      <li>Read it twice and underline the numbers and the question.</li>
      <li>Decide the operation(s): + − × ÷.</li>
      <li>Remember <b>BIDMAS</b> — do Brackets, then ×/÷, then +/−.</li>
      <li>Do one step at a time and check your answer makes sense.</li>
    </ol>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li><b>BODMAS/BIDMAS:</b> Brackets → Orders (powers) → ÷ and × → + and −. So 2 + 3 × 4 = 14, not 20.</li>
      <li><b>Integers:</b> same signs multiply/divide to +, different signs to −. Subtracting a negative adds: 5 − (−3) = 8.</li>
      <li><b>Algebra:</b> to evaluate 3x + 4 when x = 5, replace x → 3×5 + 4 = 19. To <i>solve</i> 3x + 4 = 19, undo in reverse: −4 then ÷3 → x = 5.</li>
      <li><b>Mensuration:</b> rectangle perimeter = 2(l+w), area = l×w; triangle area = ½×base×height; cuboid volume = l×w×h.</li>
      <li><b>HCF</b> = biggest number that divides both; <b>LCM</b> = smallest number both go into.</li>
    </ul>` },

  /* ============================== ENGLISH =============================== */
  "english:spell": { html: `
    <p><b>Spelling</b> gets easier when you look for patterns and tricky parts.</p>
    <ul>
      <li>Say the word slowly and listen for each sound.</li>
      <li>Watch out for silent letters (<i>Wednesday</i>, <i>friend</i>, <i>knife</i>).</li>
      <li>Use "Look → Cover → Write → Check" for new words.</li>
      <li>Plurals: most add <b>s</b>; words ending in <i>s, x, ch, sh</i> add <b>es</b>; <i>y</i> often → <b>ies</b>.</li>
    </ul>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li><b>Articles:</b> use <b>an</b> before a vowel <i>sound</i> (an hour, an honest man), <b>a</b> before a consonant sound (a university, a European).</li>
      <li><b>Prefixes</b> change meaning: <i>un-</i> = not, <i>re-</i> = again, <i>dis-</i> = opposite, <i>mis-</i> = wrongly, <i>pre-</i> = before.</li>
      <li>Learn <b>synonyms</b> (enormous = huge) and <b>idioms</b> ("a piece of cake" = very easy).</li>
    </ul>` },

  "english:gramwrite": { html: `
    <p><b>Grammar & punctuation</b> make your writing clear and correct.</p>
    <ul>
      <li>Every sentence starts with a <b>capital letter</b> and ends with <b>. ? or !</b></li>
      <li>Keep your <b>tense</b> the same (don't mix "was" and "is").</li>
      <li>Subject &amp; verb must agree: "she <b>runs</b>", "they <b>run</b>".</li>
      <li><b>Apostrophes</b>: for missing letters (do not → don't) or belonging (the dog's bone).</li>
      <li><b>Commas</b> separate items in a list and short pauses.</li>
    </ul>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li><b>Active vs passive:</b> active = "The cat chased the mouse." Passive = "The mouse <b>was chased by</b> the cat." (object + was/were + past participle + by).</li>
      <li><b>Reported speech:</b> "I am tired," she said → She said that she <b>was</b> tired. The tense shifts back and pronouns change.</li>
      <li><b>Perfect/continuous tenses:</b> "has finished", "had started", "were having".</li>
      <li><b>Semicolon</b> joins two linked sentences; a <b>colon</b> introduces a list: pen, paper, ruler.</li>
      <li><b>Question tags:</b> positive statement → negative tag ("You're coming, aren't you?").</li>
    </ul>` },

  "english:structure": { html: `
    <p><b>Structuring writing</b> means putting ideas in an order the reader can follow.</p>
    <ul>
      <li>A paragraph = a group of sentences about <i>one</i> idea.</li>
      <li>Start a <b>new paragraph</b> for a new idea, time, place or speaker.</li>
      <li>Use order words: <b>First… Then… Next… After that… Finally.</b></li>
      <li>Beginning → Middle → End: set it up, develop it, wrap it up.</li>
    </ul>
    <p><b>Grade 6 stretch:</b> know your <b>parts of speech</b> — noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection — so you can vary sentences. Use <b>reported speech</b> to summarise what characters said instead of always quoting them.</p>` },

  "english:creative": { html: `
    <p><b>Creative writing</b> paints a picture in the reader's mind.</p>
    <ul>
      <li>Plan: who is in it, where it happens, what goes wrong, how it ends.</li>
      <li>Use <b>adjectives</b> (describing words) and strong <b>verbs</b>.</li>
      <li>Show feelings through actions, not just "I was scared".</li>
      <li>Read it back aloud and fix anything that sounds wrong.</li>
    </ul>` },

  "english:reflect": { html: `
    <p><b>Opinion &amp; reflection</b> is saying what you think — and <i>why</i>.</p>
    <ul>
      <li>State your opinion clearly ("I think…", "In my view…").</li>
      <li>Back it up with <b>at least two reasons</b> using the word <b>because</b>.</li>
      <li>Use examples from the book, film or event.</li>
      <li>Finish with a recommendation or star rating.</li>
    </ul>
    <p><b>Grade 6 stretch:</b> use <b>degrees of comparison</b> to give a sharper opinion — good → better → best; interesting → more interesting → most interesting. Choose precise <b>vocabulary</b> (delighted, reluctant, fragile) rather than plain words.</p>` },

  /* ============================== SCIENCE ============================== */
  "science:life": { html: `
    <p>All living things do the <b>7 life processes</b> — remember <b>MRS GREN</b>:</p>
    <ul>
      <li><b>M</b>ovement · <b>R</b>espiration · <b>S</b>ensitivity</li>
      <li><b>G</b>rowth · <b>R</b>eproduction · <b>E</b>xcretion · <b>N</b>utrition</li>
    </ul>
    <p>If something does all 7, it is alive. A car moves and uses fuel, but it can't grow or reproduce — so it isn't alive.</p>
    <p><b>Grade 6 stretch — cells & photosynthesis:</b></p>
    <ul>
      <li>All living things are made of <b>cells</b>. Key parts: <b>nucleus</b> (controls the cell), <b>cytoplasm</b>, <b>cell membrane</b>. Plant cells also have a <b>cell wall</b>, <b>chloroplasts</b> and a <b>vacuole</b>.</li>
      <li><b>Photosynthesis:</b> in the leaves, plants use <b>carbon dioxide + water + light</b> (trapped by green <b>chlorophyll</b>) to make <b>glucose</b> and release <b>oxygen</b>.</li>
    </ul>` },

  "science:eco": { html: `
    <p>An <b>ecosystem</b> is living things and their habitat working together.</p>
    <ul>
      <li><b>Producer</b> — a plant; makes its own food from sunlight.</li>
      <li><b>Consumer</b> — an animal that eats plants or other animals.</li>
      <li><b>Predator</b> hunts · <b>Prey</b> is hunted · <b>Decomposer</b> breaks down dead things.</li>
      <li>A <b>food chain</b> shows who eats whom: grass → rabbit → fox. The arrow means "energy goes to".</li>
    </ul>
    <p><b>Grade 6 stretch:</b> producers (plants) start every food chain because they make food by <b>photosynthesis</b> — trapping the Sun's energy. That energy then passes along the chain to consumers.</p>` },

  "science:body": { html: `
    <p>The <b>human body</b> has systems that each do a job:</p>
    <ul>
      <li><b>Skeleton</b> — supports and protects (skull protects the brain).</li>
      <li><b>Muscles</b> — pull bones to make us move.</li>
      <li><b>Heart &amp; blood</b> — carry oxygen around the body.</li>
      <li><b>Lungs</b> — take in oxygen, breathe out carbon dioxide.</li>
      <li><b>Digestive system</b> — breaks food down for energy.</li>
    </ul>
    <p><b>Grade 6 stretch:</b> each system is built from <b>organs</b>, organs from <b>tissues</b>, and tissues from <b>cells</b> — the basic building block of the body. A group of similar cells working together forms a tissue.</p>` },

  "science:enquiry": { html: `
    <p>A <b>fair test</b> is how scientists find a reliable answer.</p>
    <ul>
      <li>Change <b>one thing</b> (the variable you are testing).</li>
      <li>Keep <b>everything else the same</b>.</li>
      <li>Measure carefully and, if you can, repeat to check.</li>
    </ul>
    <p>Example: to test which soil grows the tallest plant, change the soil but keep the water, light and pot size the same.</p>
    <p><b>Grade 6 stretch — measuring:</b> use the right unit and instrument: <b>length</b> → metre/ruler, <b>mass</b> → kilogram/balance, <b>liquid volume</b> → litre/measuring cylinder, <b>temperature</b> → thermometer, <b>time</b> → stopwatch. Remember 1 m = 100 cm and 1 litre = 1000 ml.</p>` },

  "science:conclude": { html: `
    <p><b>Analysis &amp; conclusions</b> is explaining what your results show.</p>
    <ul>
      <li>Look for a <b>pattern</b> in the results ("the higher the…, the more…").</li>
      <li>Write a conclusion using <b>because</b>: link the result to the science.</li>
      <li>Say if your <b>prediction</b> was right, and how you could improve the test.</li>
    </ul>
    <p><b>Grade 6 stretch — matter & materials:</b></p>
    <ul>
      <li><b>Physical change</b> (melting, boiling, dissolving) makes <i>no new substance</i> and can usually be reversed. <b>Chemical change</b> (burning, rusting, cooking) makes a <i>new substance</i> and is hard to reverse.</li>
      <li><b>Element</b> = one kind of atom (oxygen, gold). <b>Compound</b> = elements chemically joined (water). <b>Mixture</b> = not joined (air) — separate by filtering, evaporation or a magnet.</li>
    </ul>` },

  "science:space": { html: `
    <p><b>Earth in space</b>:</p>
    <ul>
      <li>The <b>Sun</b> is a star at the centre; 8 planets orbit it.</li>
      <li>Earth <b>spins</b> once a day → day and night.</li>
      <li>Earth <b>orbits</b> the Sun once a year; the Moon orbits Earth.</li>
      <li><b>Gravity</b> is the force that pulls things toward a planet or star.</li>
    </ul>
    <p><b>Grade 6 stretch — forces & machines:</b> a force is a push or pull, measured in <b>newtons (N)</b>. <b>Friction</b> slows sliding; <b>upthrust</b> makes things float; <b>gravity</b> pulls down. <b>Simple machines</b> make work easier by reducing the effort needed: lever (seesaw), pulley (flagpole), inclined plane (ramp).</p>` },

  "science:elec": { html: `
    <p><b>Electricity &amp; magnetism</b>:</p>
    <ul>
      <li>A <b>circuit</b> must be a <i>complete loop</i> for current to flow.</li>
      <li>Add a <b>switch</b> to break the loop and turn things off.</li>
      <li>More cells (batteries) → brighter bulb; a break stops the current.</li>
      <li><b>Magnets</b> attract iron/steel; like poles push apart, opposite poles pull together.</li>
    </ul>
    <p><b>Grade 6 stretch:</b></p>
    <ul>
      <li>A magnet has a <b>north</b> and <b>south</b> pole; the pull is strongest at the poles. Like poles <b>repel</b>, opposite poles <b>attract</b>. An <b>electromagnet</b> uses an electric current.</li>
      <li><b>Energy</b> comes in forms — kinetic (movement), chemical (food/batteries), light, sound, heat, potential — and can be <b>changed</b> from one form to another, never created or destroyed. Solar and wind are <b>renewable</b>.</li>
    </ul>` }
};
