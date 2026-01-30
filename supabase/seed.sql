-- Semantic Flow - 种子数据
-- 执行方式：在 Supabase SQL Editor 中运行此脚本（schema.sql 后执行）
-- 注意：此脚本支持重复运行，会覆盖已存在的数据

-- ============================================
-- 清理旧数据（如果存在）
-- ============================================
DELETE FROM cards WHERE deck_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

DELETE FROM decks WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- ============================================
-- 创建示例卡组 (3 个主题)
-- ============================================

-- Deck A: IELTS Writing Task 2 - Tech & Education
INSERT INTO decks (id, title, is_custom, user_id) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'IELTS Writing Task 2 - Tech & Education', false, null);

-- Deck B: Business Email - Negotiation
INSERT INTO decks (id, title, is_custom, user_id) VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Business Email - Negotiation', false, null);

-- Deck C: Nuanced Emotions
INSERT INTO decks (id, title, is_custom, user_id) VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Nuanced Emotions', false, null);

-- ============================================
-- Deck A: IELTS Writing Task 2 - Tech & Education (10 cards)
-- ============================================

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '过度的电子游戏会侵占宝贵的学习时间', 
 'Argument: Negative Impact',
 '[{"text": "Excessive gaming encroaches upon valuable study time.", "tag": "Academic"}, {"text": "Spending too much time on video games eats into productive learning hours.", "tag": "Informal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '科技在弥合城乡教育差距方面发挥着关键作用', 
 'Positive Technology Argument',
 '[{"text": "Technology plays a pivotal role in bridging the urban-rural educational divide.", "tag": "Formal"}, {"text": "Digital tools are instrumental in narrowing the gap between city and countryside schools.", "tag": "Academic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '网络依赖对学生的社交能力产生不利影响', 
 'Social Impact Analysis',
 '[{"text": "Internet dependency exerts a detrimental effect on students'' interpersonal skills.", "tag": "Academic"}, {"text": "Reliance on the web adversely impacts young people''s ability to socialize.", "tag": "Semiformal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '在线课程无法复制面对面教学的互动性', 
 'Comparison Argument',
 '[{"text": "Online courses fail to replicate the interactive nature of face-to-face instruction.", "tag": "Academic"}, {"text": "Virtual learning cannot fully emulate the engagement of in-person classes.", "tag": "Formal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '人工智能有望彻底变革教育评估方式', 
 'Future Trends',
 '[{"text": "Artificial intelligence is poised to revolutionize educational assessment methods.", "tag": "Formal"}, {"text": "AI stands to fundamentally transform how we evaluate academic performance.", "tag": "Academic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '学校应该将批判性思维纳入核心课程', 
 'Policy Recommendation',
 '[{"text": "Schools ought to incorporate critical thinking into their core curriculum.", "tag": "Formal"}, {"text": "Educational institutions should embed analytical reasoning skills into mandatory coursework.", "tag": "Academic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '数字素养已成为现代社会不可或缺的技能', 
 'Necessity Argument',
 '[{"text": "Digital literacy has become an indispensable skill in contemporary society.", "tag": "Formal"}, {"text": "Technological proficiency is now a prerequisite for navigating the modern world.", "tag": "Academic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '教育资源分配不均加剧了社会不平等', 
 'Social Issue',
 '[{"text": "The uneven distribution of educational resources exacerbates social inequality.", "tag": "Academic"}, {"text": "Disparities in access to quality education compound existing socioeconomic divides.", "tag": "Formal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '学生应该培养自主学习的习惯', 
 'Self-improvement',
 '[{"text": "Students should cultivate habits of autonomous learning.", "tag": "Formal"}, {"text": "Learners ought to develop self-directed study practices.", "tag": "Academic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('11111111-1111-1111-1111-111111111111', 
 '终身学习理念应贯穿教育体系始终', 
 'Educational Philosophy',
 '[{"text": "The ethos of lifelong learning should permeate the entire educational system.", "tag": "Academic"}, {"text": "Continuous learning must be woven into the fabric of education.", "tag": "Formal"}]'::jsonb);

-- ============================================
-- Deck B: Business Email - Negotiation (10 cards)
-- ============================================

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '恐怕我们目前无法满足您的报价要求', 
 'Polite Decline',
 '[{"text": "I am afraid we are not in a position to meet your pricing requirements at this time.", "tag": "Formal"}, {"text": "Unfortunately, accommodating your quote falls outside our current scope.", "tag": "Diplomatic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '我们愿意在某些条款上做出妥协', 
 'Negotiation Offer',
 '[{"text": "We are amenable to making concessions on certain terms.", "tag": "Formal"}, {"text": "Our team is open to compromise regarding specific clauses.", "tag": "Business"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '请允许我进一步阐述我方的立场', 
 'Clarification Request',
 '[{"text": "Kindly allow me to elaborate on our position.", "tag": "Formal"}, {"text": "If I may, I would like to expound upon our stance.", "tag": "Diplomatic"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '我们期待与贵方建立长期的合作关系', 
 'Partnership Building',
 '[{"text": "We look forward to establishing a long-term partnership with your esteemed organization.", "tag": "Formal"}, {"text": "Our company anticipates cultivating an enduring business relationship with yours.", "tag": "Business"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '鉴于当前的市场状况，我们需要重新评估这一提议', 
 'Market Analysis',
 '[{"text": "Given the prevailing market conditions, we need to reassess this proposal.", "tag": "Business"}, {"text": "In light of current market dynamics, a reevaluation of this offer is warranted.", "tag": "Formal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '这个价格超出了我们的预算范围', 
 'Budget Discussion',
 '[{"text": "This pricing exceeds the parameters of our allocated budget.", "tag": "Formal"}, {"text": "The proposed cost falls outside our financial constraints.", "tag": "Business"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '我们对您的提案很感兴趣，但还有几点需要澄清', 
 'Follow-up Interest',
 '[{"text": "We find your proposal intriguing; however, several points require clarification.", "tag": "Formal"}, {"text": "Your offer has piqued our interest, though some aspects need further elucidation.", "tag": "Business"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '合同条款需要双方法务部门审核', 
 'Legal Process',
 '[{"text": "The contract terms are subject to review by both parties'' legal departments.", "tag": "Formal"}, {"text": "Our respective legal teams must vet the agreement provisions.", "tag": "Business"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '为了推进此事，我们建议安排一次电话会议', 
 'Meeting Proposal',
 '[{"text": "To move this matter forward, we suggest scheduling a conference call.", "tag": "Business"}, {"text": "In the interest of advancing discussions, a teleconference would be advisable.", "tag": "Formal"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('22222222-2222-2222-2222-222222222222', 
 '感谢您的耐心等待，附件是修订后的报价单', 
 'Follow-up with Attachment',
 '[{"text": "Thank you for your patience; please find attached the revised quotation.", "tag": "Business"}, {"text": "We appreciate your forbearance and enclose herewith the amended pricing schedule.", "tag": "Formal"}]'::jsonb);

-- ============================================
-- Deck C: Nuanced Emotions (10 cards)
-- ============================================

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '他的话语中透露出一丝不易察觉的苦涩', 
 'Subtle Bitterness',
 '[{"text": "His words carried an imperceptible trace of bitterness.", "tag": "Literary"}, {"text": "There was a faint, barely detectable note of acrimony in his voice.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '她试图掩饰内心的忐忑不安', 
 'Hidden Anxiety',
 '[{"text": "She tried to hide her nervous unease.", "tag": "Neutral"}, {"text": "She struggled to mask the anxiety gnawing at her from within.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '这个消息让他既欣慰又惆怅', 
 'Mixed Feelings',
 '[{"text": "The news left him feeling both gratified and wistful.", "tag": "Literary"}, {"text": "He was simultaneously comforted and melancholic upon hearing this.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '她的笑容背后隐藏着深深的疲惫', 
 'Concealed Exhaustion',
 '[{"text": "Behind her smile lay a profound weariness.", "tag": "Literary"}, {"text": "Her cheerful facade belied the bone-deep fatigue she felt.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '回忆涌上心头，带来一阵酸楚', 
 'Nostalgic Pain',
 '[{"text": "Memories flooded back, bringing a pang of sorrow.", "tag": "Literary"}, {"text": "Recollections washed over him, evoking a bittersweet ache.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '他对自己的无能为力感到深深的挫败', 
 'Frustration and Helplessness',
 '[{"text": "He felt a profound sense of defeat at his own powerlessness.", "tag": "Formal"}, {"text": "A crushing frustration gripped him as he confronted his helplessness.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '那一刻，她心中涌起难以言喻的感动', 
 'Overwhelming Emotion',
 '[{"text": "In that moment, she was overcome by an indescribable sense of being touched.", "tag": "Neutral"}, {"text": "A profound, wordless feeling of being moved welled up within her.", "tag": "Literary"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '他的沉默比任何言语都更令人窒息', 
 'Oppressive Silence',
 '[{"text": "His silence was more suffocating than any words could be.", "tag": "Literary"}, {"text": "The weight of his unspoken thoughts hung heavy in the air.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '她假装若无其事，但内心波澜起伏', 
 'Inner Turmoil',
 '[{"text": "She feigned nonchalance, yet a tempest raged within.", "tag": "Literary"}, {"text": "Despite her composed exterior, emotions roiled beneath the surface.", "tag": "Descriptive"}]'::jsonb);

INSERT INTO cards (deck_id, chinese_concept, context_hint, anchor_data) VALUES
('33333333-3333-3333-3333-333333333333', 
 '离别的愁绪萦绕在他心头久久不散', 
 'Lingering Sadness',
 '[{"text": "The sorrow of parting lingered in his heart, slow to fade.", "tag": "Neutral"}, {"text": "A wistful sadness from the farewell stayed with him, refusing to let go.", "tag": "Literary"}]'::jsonb);
