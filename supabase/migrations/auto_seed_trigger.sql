-- ============================================================================
-- AUTO-SEEDING MIGRATION (TRIGGER + BACKFILL) - FIXED VERSION
-- ============================================================================
-- 修复说明 (Fixes):
-- 1. [CRITICAL] 之前的 INSERT cards 漏掉了 user_id，导致 RLS 策略使得卡片对用户不可见。
--    现在通过 `user_id` 参数确保卡片正确归属于用户。
-- 2. 增加了清理逻辑：自动删除该卡组下 user_id 为空的"幽灵卡片"。
-- 3. 逻辑改进：即使卡组已存在，也会检查并补充缺失的卡片。
-- ============================================================================

-- A. Create the function to insert decks
CREATE OR REPLACE FUNCTION public.setup_starter_decks(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deck1_id uuid;
    deck2_id uuid;
BEGIN
    -- 确保传入的 user_id 不为空
    IF target_user_id IS NULL THEN
        RAISE WARNING 'target_user_id cannot be null';
        RETURN;
    END IF;

    ---------------------------------------------------------------------------
    -- DECK 1: IELTS Writing Task 1
    ---------------------------------------------------------------------------
    -- 1. Get or Create Deck 1
    SELECT id INTO deck1_id 
    FROM public.decks 
    WHERE user_id = target_user_id AND title = 'IELTS Writing Task 1: High-Value Patterns' 
    LIMIT 1;

    IF deck1_id IS NULL THEN
        INSERT INTO public.decks (user_id, title, is_custom)
        VALUES (target_user_id, 'IELTS Writing Task 1: High-Value Patterns', false)
        RETURNING id INTO deck1_id;
    END IF;

    -- 2. Cleanup ghost cards (cards with null user_id) in this deck
    DELETE FROM public.cards WHERE deck_id = deck1_id AND user_id IS NULL;

    -- 3. Check if we need to seed cards
    -- (We insert if the deck is empty)
    IF NOT EXISTS (SELECT 1 FROM public.cards WHERE deck_id = deck1_id LIMIT 1) THEN
        INSERT INTO public.cards (deck_id, user_id, chinese_concept, context_hint, anchor_data) VALUES
        (deck1_id, target_user_id, '尽管在最初三年里经历了剧烈震荡，该数字随后呈现出指数级增长。', 'Describing a volatile start followed by growth (Line Graph)', '[{"text": "Although the figure went through a rocky start for three years, it later skyrocketed.", "tag": "Natural"}, {"text": "Albeit experiencing a period of volatility in the initial triennium, the figure subsequently exhibited an exponential growth trajectory.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '与前者原本的上升趋势截然相反，后者经历了断崖式下跌。', 'Contrasting two opposing trends (Line Graph)', '[{"text": "Unlike the first one going up, the second one took a nosedive.", "tag": "Natural"}, {"text": "In stark contrast to the upward trajectory of the former, the latter witnessed a precipitous decline.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '可再生能源的比例预计将以此速度攀升，并在本世纪中叶超过化石燃料。', 'Future prediction & Overtaking (Bar/Line Chart)', '[{"text": "Renewables are set to keep rising at this pace and should overtake fossil fuels by mid-century.", "tag": "Natural"}, {"text": "Projected to climb at this momentum, the proportion of renewable energy is anticipated to surpass that of fossil fuels by the mid-21st century.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '该行业的产值一直停滞不前，直到2010年才出现复苏迹象。', 'Stagnation followed by recovery (Line Graph)', '[{"text": "The industry''s output flatlined for ages and only showed signs of picking up in 2010.", "tag": "Natural"}, {"text": "The sector''s output remained stagnant for a prolonged period, showing no signs of resurgence until 2010.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '至于消费者支出，它是一个显著的例外，并未遵循整体的下行趋势。', 'Highlighting an exception (Table/Chart)', '[{"text": "As for consumer spending, it stood out by not following the general downward trend.", "tag": "Natural"}, {"text": "Regarding consumer spending, it constituted a notable exception, failing to conform to the prevailing downward pattern.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '这两类支出的差距在十年间逐渐缩小，最终在2020年持平。', 'Narrowing gap & Convergence (Line Graph)', '[{"text": "The gap between these two costs narrowed over the decade and finally leveled out in 2020.", "tag": "Natural"}, {"text": "The disparity between the two categories of expenditure diminished progressively over the decade, eventually reaching parity in 2020.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '这一数字仅占总量的微不足道的一小部分，几乎可以忽略不计。', 'Describing a very small proportion (Pie Chart)', '[{"text": "This figure makes up just a tiny fraction of the total—it''s basically negligible.", "tag": "Natural"}, {"text": "Assuming a negligible fraction of the total, this figure is statistically insignificant.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, 'A国的石油消费量是B国的两倍，凸显了巨大的能源需求差异。', 'Comparison / Multiples (Bar Chart)', '[{"text": "Country A burns through twice as much oil as Country B, showing a huge gap in energy needs.", "tag": "Natural"}, {"text": "Oil consumption in Country A was twofold that of Country B, underscoring a substantial disparity in energy demand.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '在整个期间内，数据一直在30%到40%的狭窄区间内反复震荡。', 'Fluctuation within a range (Line Graph)', '[{"text": "Throughout the period, the numbers kept bouncing back and forth between 30% and 40%.", "tag": "Natural"}, {"text": "Throughout the duration, the data oscillated continuously within a narrow bracket of 30% to 40%.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '随着新基础设施的建成，原本的住宅区被彻底拆除，为商业中心腾出空间。', 'Map / Transformation (Map)', '[{"text": "With the new infrastructure up, the old housing area was knocked down to make way for a business hub.", "tag": "Natural"}, {"text": "Concomitant with the completion of new infrastructure, the original residential zone was completely demolished to make way for the commercial center.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '一旦原材料经过分拣，它们会被传送带输送到下一个阶段进行清洗。', 'Process / Passive Voice (Process Diagram)', '[{"text": "Once the raw materials are sorted, they get sent along a conveyor belt to be washed.", "tag": "Natural"}, {"text": "Once the raw materials are sorted, they are transported via a conveyor belt to the subsequent stage for cleansing.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '虽然男性吸烟率在稳步下降，但女性吸烟率却呈现出令人担忧的上升态势。', 'Comparison of opposing trends (Bar/Line)', '[{"text": "While fewer men are smoking these days, the number of female smokers is worryingly on the rise.", "tag": "Natural"}, {"text": "Whilst the prevalence of smoking among males has steadily declined, that among females has exhibited a disconcerting upward trajectory.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '核能发电量在2005年达到峰值，随后的二十年里则持续缩减。', 'Peaking and declining (Line Graph)', '[{"text": "Nuclear power hit its peak in 2005 but has been shrinking for the last twenty years.", "tag": "Natural"}, {"text": "Nuclear power generation reached a zenith in 2005, followed by a sustained contraction over the ensuing two decades.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '占据主导地位的是煤炭，其贡献了总发电量的四分之三以上。', 'Majority / Dominance (Pie Chart)', '[{"text": "Coal is the main player here, accounting for more than three-quarters of all power generated.", "tag": "Natural"}, {"text": "Dominating the portfolio was coal, which accounted for over three-quarters of the total electricity generation.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '从总体上看，该图表揭示了从传统制造业向服务型经济的显著转变。', 'Overview / General Trend (Introduction)', '[{"text": "Overall, the chart shows a clear shift from old-school manufacturing to a service-based economy.", "tag": "Natural"}, {"text": "Overall, the chart reveals a pronounced transition from traditional manufacturing towards a service-oriented economy.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '这两个类别呈现出高度的正相关性：一个增长，另一个也随之攀升。', 'Correlation (Scatter/Line)', '[{"text": "These two groups are totally linked: when one goes up, the other follows suit.", "tag": "Natural"}, {"text": "The two categories exhibit a high degree of positive correlation: as one ascends, the other climbs in tandem.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '该设施坐落于河的北岸，与南面的工业园区隔水相望。', 'Location / Geography (Map)', '[{"text": "The facility sits on the north bank of the river, right across the water from the industrial park to the south.", "tag": "Natural"}, {"text": "The facility is situated on the northern bank of the river, facing the industrial park to the south across the water.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '在经历了初期的平稳期后，该比率突然急转直下。', 'Sudden change (Line Graph)', '[{"text": "After staying flat for a bit, the rate suddenly fell off a cliff.", "tag": "Natural"}, {"text": "Following an initial plateau, the rate underwent an abrupt and steep downturn.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '这种下降趋势在2015年被短暂打断，但随即又恢复了跌势。', 'Interruption of trend (Line Graph)', '[{"text": "The drop was briefly interrupted in 2015, but then it went right back to falling.", "tag": "Natural"}, {"text": "This downward trend was momentarily interrupted in 2015, only to resume its decline shortly thereafter.", "tag": "Formal"}]'::jsonb),
        (deck1_id, target_user_id, '分别来看，X 和 Y 的数值均未超过临界点，表明其影响有限。', 'Individual analysis (Bar Chart)', '[{"text": "Looking at them separately, neither X nor Y crossed the danger line, so they didn''t have much impact.", "tag": "Natural"}, {"text": "Respective analysis reveals that neither X nor Y surpassed the critical threshold, indicating limited impact.", "tag": "Formal"}]'::jsonb);
    END IF;

    ---------------------------------------------------------------------------
    -- DECK 2: IELTS Writing Task 2: Core Arguments
    ---------------------------------------------------------------------------
    -- 1. Get or Create Deck 2
    SELECT id INTO deck2_id 
    FROM public.decks 
    WHERE user_id = target_user_id AND title = 'IELTS Writing Task 2: Core Arguments' 
    LIMIT 1;

    IF deck2_id IS NULL THEN
        INSERT INTO public.decks (user_id, title, is_custom)
        VALUES (target_user_id, 'IELTS Writing Task 2: Core Arguments', false)
        RETURNING id INTO deck2_id;
    END IF;

    -- 2. Cleanup ghost cards
    DELETE FROM public.cards WHERE deck_id = deck2_id AND user_id IS NULL;

    -- 3. Seed Cards
    IF NOT EXISTS (SELECT 1 FROM public.cards WHERE deck_id = deck2_id LIMIT 1) THEN
        INSERT INTO public.cards (deck_id, user_id, chinese_concept, context_hint, anchor_data) VALUES
        (deck2_id, target_user_id, '在大数据时代，个人隐私常被视作一种可交易的商品，而非神圣不可侵犯的权利。', 'Technology / Privacy (Argument)', '[{"text": "In the age of big data, privacy is often treated like a commodity to be traded, not a sacred right.", "tag": "Natural"}, {"text": "In the era of big data, personal privacy is frequently commodified as a tradable asset rather than revered as an inviolable right.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '算法推荐虽提升了效率，却也极易将用户囿于“信息茧房”之中，致使视野日趋狭隘。', 'Technology / Media (Impact Analysis)', '[{"text": "Algorithms make things efficient, but they can easily trap users in ''filter bubbles,'' narrowing their worldviews.", "tag": "Natural"}, {"text": "While enhancing efficiency, algorithmic recommendations are prone to confining users within ''information cocoons,'' thereby rendering their perspectives increasingly parochial.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '自动化浪潮虽能解放生产力，却也让低技能劳动者面临前所未有的结构性失业危机。', 'Technology / Work (Concession & Refutation)', '[{"text": "Automation might boost productivity, but it puts low-skilled workers at huge risk of losing their jobs for good.", "tag": "Natural"}, {"text": "Albeit liberating productivity, the wave of automation exposes low-skilled laborers to an unprecedented crisis of structural unemployment.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '除非各国采取严厉的立法措施，否则环境恶化将很快逼近不可逆的临界点。', 'Environment / Climate Change (Condition)', '[{"text": "Unless countries crack down with tough laws, environmental damage will soon hit a point of no return.", "tag": "Natural"}, {"text": "Absent stringent legislative measures by nations, environmental degradation will rapidly approach an irreversible tipping point.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '将环境治理的责任完全推卸给个人是不公平的，因为企业才是碳排放的始作俑者。', 'Environment / Responsibility (Critique)', '[{"text": "It''s unfair to dump all the blame on individuals when corporations are the ones pumping out the carbon.", "tag": "Natural"}, {"text": "It is inequitable to relegate the responsibility for environmental governance solely to individuals, given that corporations are the primary perpetrators of carbon emissions.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '过度的消费主义不仅耗尽了自然资源，更助长了一种以物质占有定义成功的肤浅文化。', 'Society / Consumerism (Cause & Effect)', '[{"text": "Hyper-consumerism doesn''t just drain resources; it fuels a shallow culture where success is all about what you own.", "tag": "Natural"}, {"text": "Excessive consumerism not only depletes natural resources but also fosters a superficial culture where success is defined by material possession.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '填鸭式教育往往扼杀学生的批判性思维，使其沦为被动的知识接收容器。', 'Education / Methodology (Critique)', '[{"text": "Spoon-feeding education often kills critical thinking, turning students into passive vessels for facts.", "tag": "Natural"}, {"text": "Rote learning methodologies tend to stifle critical thinking, reducing students to passive recipients of knowledge.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '高等教育不应仅仅是职业培训基地，更应是思想启蒙与人格重塑的殿堂。', 'Education / University Purpose (Definition)', '[{"text": "Universities shouldn''t just be job training centers; they should be places that open minds and build character.", "tag": "Natural"}, {"text": "Tertiary institutions should function not merely as vocational training grounds but as bastions of intellectual enlightenment and character reformation.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '只有通过接触艺术，学生才能培养出无法被科学课程所替代的审美感知力与共情能力。', 'Education / Arts vs Science (Inversion/Emphasis)', '[{"text": "Only by engaging with the arts can students develop empathy and a sense of beauty that science classes just can''t teach.", "tag": "Natural"}, {"text": "Only through exposure to the arts can students cultivate aesthetic sensibility and empathy—faculties that scientific curriculum cannot replicate.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '在资源稀缺的背景下，将公共预算优先投入医疗而非艺术，是功利但理性的抉择。', 'Government / Budget (Justification)', '[{"text": "With money tight, putting healthcare before the arts is a practical, if cold, choice.", "tag": "Natural"}, {"text": "Against a backdrop of resource scarcity, prioritizing the allocation of public funds to healthcare over the arts constitutes a utilitarian yet rational decision.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '政府若不加以监管，跨国巨头便会利用其垄断地位操纵市场，损害公众利益。', 'Government / Regulation (Prediction)', '[{"text": "If the government doesn''t step in, multinational giants will use their power to rig the market and hurt the public.", "tag": "Natural"}, {"text": "Without governmental intervention, multinational conglomerates will inevitably exploit their monopoly status to manipulate the market to the detriment of public interest.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '虽然审查制度能过滤有害信息，但它也可能被滥用，成为压制异见和阻碍创新的工具。', 'Government / Censorship (Concession)', '[{"text": "Censorship can block harmful stuff, but it can also be abused to silence critics and stop new ideas.", "tag": "Natural"}, {"text": "While censorship serves to filter deleterious information, it is susceptible to abuse as an instrument for suppressing dissent and impeding innovation.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '人口老龄化不仅给公共医疗系统带来重压，更可能导致劳动力市场的严重萎缩。', 'Society / Aging Population (Impact)', '[{"text": "An aging population doesn''t just strain the health system; it could also cause the workforce to shrink seriously.", "tag": "Natural"}, {"text": "An aging demographic not only imposes a severe strain on the public healthcare system but also precipitates a significant contraction of the labor market.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '全球化的洪流正逐渐冲刷掉本土文化的独特性，导致世界呈现出一种乏味的同质化倾向。', 'Society / Globalization (Metaphor)', '[{"text": "The flood of globalization is washing away local traditions, making the world look more and more the same.", "tag": "Natural"}, {"text": "The torrent of globalization is gradually eroding the distinctiveness of indigenous cultures, leading to a tedious tendency towards cultural homogenization.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '城市化的快速扩张往往以牺牲社区归属感和邻里关系疏离为代价。', 'Society / Urbanization (Trade-off)', '[{"text": "Cities are growing fast, but the cost is often losing that sense of community and drifting apart from neighbors.", "tag": "Natural"}, {"text": "Rapid urbanization is frequently achieved at the expense of communal belonging and the alienation of neighborhood relations.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '监禁的首要目的应是改造罪犯，而非单纯的惩罚，从而从根本上降低其再次犯罪的概率。', 'Crime / Purpose of Prison (Opinion)', '[{"text": "The main point of prison should be to fix offenders, not just punish them, so they don''t commit crimes again.", "tag": "Natural"}, {"text": "The primary objective of incarceration should be rehabilitation rather than mere retribution, thereby fundamentally mitigating the probability of recidivism.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '青少年犯罪往往是家庭教育缺失和社会不平等共同作用的产物，而非单纯的个人堕落。', 'Crime / Juvenile Delinquency (Root Cause)', '[{"text": "Kids committing crimes is usually down to broken homes and inequality, not just them being bad apples.", "tag": "Natural"}, {"text": "Juvenile delinquency is often the byproduct of the combined effects of familial negligence and social inequality, rather than mere personal depravity.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '媒体对暴力的渲染可能会导致观众脱敏，使他们在现实生活中对苦难变得麻木不仁。', 'Media / Violence (Psychological Effect)', '[{"text": "Media violence can desensitize viewers, making them numb to real-life suffering.", "tag": "Natural"}, {"text": "The glamorization of violence in media may desensitize audiences, rendering them apathetic to suffering in reality.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '远程办公虽提供了灵活性，却也模糊了工作与生活的界限，导致隐形加班现象泛滥。', 'Work / Remote Working (Problem)', '[{"text": "Remote work is flexible, but it blurs the line between job and home, often leading to working overtime without realizing it.", "tag": "Natural"}, {"text": "While offering flexibility, telecommuting blurs the boundaries between professional and private life, leading to the proliferation of unpaid overtime.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这种短视的政策无异于杀鸡取卵，虽然带来了短期收益，却牺牲了长期的可持续发展。', 'General / Policy Critique (Idiom/Metaphor)', '[{"text": "This short-sighted policy is like killing the goose that lays the golden eggs—quick cash now, but no future.", "tag": "Natural"}, {"text": "This myopic policy is tantamount to draining the pond to catch the fish, sacrificing long-term sustainability for ephemeral gains.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '尽管法律禁止歧视，女性在晋升到高层管理职位时仍面临隐形障碍。', 'Work / Gender Equality (Metaphor)', '[{"text": "Even with laws against it, women still hit a ''glass ceiling'' when trying to reach top jobs.", "tag": "Natural"}, {"text": "Despite legislative prohibitions, females continue to encounter a ''glass ceiling'' when aspiring to upper-echelon management positions.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '与其给予直接的金钱援助，不如向贫困国家传授技术，以实现长期的自给自足。', 'Globalization / International Aid (Strategy)', '[{"text": "Instead of just handing out cash, it''s better to teach poor countries skills so they can stand on their own feet.", "tag": "Natural"}, {"text": "Rather than extending direct monetary aid, it is more efficacious to transfer technology to impoverished nations to facilitate long-term self-sufficiency.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '对含糖饮料征税不仅能增加财政收入，更能倒逼食品公司降低产品含糖量。', 'Health / Government Intervention (Dual Benefit)', '[{"text": "A sugar tax wouldn''t just bring in money; it would force food companies to cut down on sugar.", "tag": "Natural"}, {"text": "Imposing a levy on sugar serves not only to augment fiscal revenue but also to compel food corporations to reduce the saccharine content of their products.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '如果不大力投资公共交通系统，仅仅拓宽道路无法从根本上缓解城市拥堵。', 'Transport / Urban Planning (Condition)', '[{"text": "Unless we pump money into public transport, just widening roads won''t fix the traffic jams.", "tag": "Natural"}, {"text": "Absent substantial investment in public transit systems, mere road expansion will fail to fundamentally alleviate urban congestion.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这种广告策略利用了儿童心理的不成熟，诱导他们渴望那些非必需的昂贵玩具。', 'Media / Advertising (Ethics)', '[{"text": "These ads prey on kids being immature, tricking them into wanting expensive toys they don''t need.", "tag": "Natural"}, {"text": "Such advertising strategies exploit the psychological immaturity of children, inducing a craving for superfluous and exorbitant toys.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '许多产品的设计初衷就是为了在使用几年后损坏，迫使消费者不断购买新品。', 'Consumerism / Planned Obsolescence (Critique)', '[{"text": "Many products are built to break after a few years just to force us to keep buying new ones.", "tag": "Natural"}, {"text": "Many products are engineered with ''planned obsolescence'', necessitating repeated purchases by consumers upon premature failure.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '由于缺乏面对面的互动，沉迷于社交媒体反而加剧了现代人的孤独感。', 'Social Media / Mental Health (Irony)', '[{"text": "Because real face-to-face time is missing, being hooked on social media actually makes people lonelier.", "tag": "Natural"}, {"text": "Due to the deficit of face-to-face interaction, addiction to social media paradoxically exacerbates the sense of isolation among modern individuals.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '虽然旅游业能带来经济繁荣，但不受控制的游客涌入往往会破坏当地脆弱的生态系统。', 'Tourism / Environment (Contrast)', '[{"text": "Tourism brings in cash, sure, but letting crowds flood in unchecked often trashes the local nature.", "tag": "Natural"}, {"text": "While tourism generates economic prosperity, an unregulated influx of visitors frequently devastates fragile indigenous ecosystems.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '无论是为了科学突破还是医学进步，对动物进行残酷实验在道德上都是站不住脚的。', 'Animal Rights / Ethics (Strong Opinion)', '[{"text": "Whether for science or medicine, testing on animals is cruel and morally wrong.", "tag": "Natural"}, {"text": "Whether for scientific breakthrough or medical advancement, subjecting animals to cruel experimentation remains morally indefensible.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '与其让政府资助精英体育，不如将资金投入基层体育设施，以提升全民健康水平。', 'Government / Sports Funding (Prioritization)', '[{"text": "Instead of funding elite athletes, the government should put money into local sports centers to get everyone healthy.", "tag": "Natural"}, {"text": "Rather than subsidizing elite sports, public funds would be better allocated to grassroots facilities to enhance the overall public health.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这两种现象之间存在相关性，但这并不意味着前者直接导致了后者。', 'General Logic / Causation (Critical Thinking)', '[{"text": "These two things are linked, but that doesn''t mean one caused the other.", "tag": "Natural"}, {"text": "A correlation exists between these two phenomena; however, this does not imply that the former is the direct causative agent of the latter.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '为了遏制谣言的传播，社交平台必须承担起“把关人”的责任，而非声称自己只是技术中立者。', 'Media / Fake News (Responsibility)', '[{"text": "To stop rumors spreading, social platforms have to act as gatekeepers, not just claim they are neutral tech companies.", "tag": "Natural"}, {"text": "To curb the proliferation of misinformation, social platforms must assume the role of ''gatekeepers'' rather than claiming the status of neutral technological conduits.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '随着城市向外无序蔓延，通勤时间的延长显著降低了市民的生活幸福感。', 'City / Urban Sprawl (Effect)', '[{"text": "As cities sprawl out of control, longer commutes are making people miserable.", "tag": "Natural"}, {"text": "Concomitant with urban sprawl, prolonged commuting durations have significantly diminished the subjective well-being of citizens.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这种单一栽培的农业模式虽然产量高，却极易受到病虫害的侵袭。', 'Environment / Agriculture (Risk)', '[{"text": "Growing just one crop yields a lot, but it''s super easy for pests or diseases to wipe it out.", "tag": "Natural"}, {"text": "While high-yielding, this monoculture agricultural model is highly susceptible to infestations by pests and diseases.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '过度的父母保护会剥夺孩子从失败中学习的机会，导致他们成年后缺乏抗压能力。', 'Family / Parenting (Consequence)', '[{"text": "Over-parenting stops kids from learning from mistakes, leaving them unable to handle stress as adults.", "tag": "Natural"}, {"text": "Excessive parental protection deprives children of the opportunity to learn from failure, resulting in a lack of resilience in adulthood.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '尽管英语的普及促进了国际交流，但也加速了少数族裔语言的消亡。', 'Language / Culture (Double-edged Sword)', '[{"text": "English helps everyone talk, but it''s also killing off minority languages faster.", "tag": "Natural"}, {"text": "Although the ubiquity of English facilitates international communication, it simultaneously accelerates the extinction of minority languages.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这种看法虽然在直觉上很有吸引力，但在实证数据面前却经不起推敲。', 'General Logic / Refutation (Academic)', '[{"text": "This idea feels right, but the actual data doesn''t back it up.", "tag": "Natural"}, {"text": "While intuitively appealing, this perspective fails to withstand scrutiny when confronted with empirical data.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '无论科技如何进步，教师的情感支持和榜样作用是人工智能永远无法替代的。', 'Education / AI (Human Element)', '[{"text": "No matter how good tech gets, AI can never replace the emotional support and role modeling a teacher gives.", "tag": "Natural"}, {"text": "Regardless of technological advancements, the emotional support and role modeling provided by teachers remain irreplaceable by artificial intelligence.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '对极端艺术形式的宽容是一个社会开放程度和成熟度的重要标志。', 'Society / Art & Freedom (Definition)', '[{"text": "Being okay with extreme art shows how open and mature a society is.", "tag": "Natural"}, {"text": "Tolerance towards radical artistic forms serves as a significant hallmark of a society''s openness and maturity.", "tag": "Formal"}]'::jsonb),
        (deck2_id, target_user_id, '这种短视行为所带来的环境代价，最终将由我们的子孙后代来偿还。', 'Environment / Intergenerational Justice (Warning)', '[{"text": "Our kids and grandkids will end up paying the price for the environmental mess we''re making now.", "tag": "Natural"}, {"text": "The environmental costs incurred by such myopic behavior will ultimately be borne by our future generations.", "tag": "Formal"}]'::jsonb);
    END IF;

END;
$$;


-- B. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.setup_starter_decks(new.id);
    RETURN new;
END;
$$;


-- C. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();


-- D. Backfill for existing users (Anonymous Block)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM auth.users
    LOOP
        -- The setup_starter_decks function checks for duplicates inside
        PERFORM public.setup_starter_decks(r.id);
    END LOOP;
END $$;
