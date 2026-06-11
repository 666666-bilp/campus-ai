const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');
const { success, error } = require('../utils/response');

exports.bilingualReading = async (req, res, next) => {
  try {
    const { text, direction } = req.body;
    if (!text) return error(res, '请输入需要翻译的文本', 400);
    // direction: 'zh2en' → 中文译英文, 'en2zh' → 英文译中文
    const targetLang = direction === 'zh2en' ? 'en' : direction === 'en2zh' ? 'zh' : 'en';
    const result = await aiService.translateText(text, targetLang);
    if (!result.success) {
      return error(res, 'Translation failed: ' + (result.error || 'Unknown error'), 500);
    }
    success(res, result.data, '翻译完成');
  } catch (err) { next(err); }
};

exports.oralPracticeStart = async (req, res, next) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      type: 'oral_practice',
      title: `口语练习 ${new Date().toLocaleDateString()}`,
      messages: []
    });
    success(res, conversation, '口语练习已开始', 201);
  } catch (err) { next(err); }
};

exports.oralPracticeChat = async (req, res, next) => {
  try {
    const { conversationId, message, scenario } = req.body;

    if (!conversationId) {
      return error(res, '请提供会话ID (conversationId)', 400);
    }
    if (!message) return error(res, '请输入消息内容', 400);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      type: 'oral_practice'
    });
    if (!conversation) return error(res, '会话不存在', 404);

    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const aiResult = await aiService.aiOralPractice(
      scenario || '日常对话',
      message,
      conversation.messages
    );

    const aiResponse = (aiResult.success && aiResult.data) ? aiResult.data : 'Sorry, I cannot respond at the moment.';

    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await conversation.save();
    success(res, { reply: aiResponse, conversation }, '回复成功');
  } catch (err) { next(err); }
};

exports.oralPracticeHistory = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user._id,
      type: 'oral_practice'
    })
      .sort('-updatedAt')
      .select('title createdAt updatedAt messages');
    success(res, conversations);
  } catch (err) { next(err); }
};

exports.cetAnalysis = async (req, res, next) => {
  try {
    const { question, type } = req.body;
    if (!question) return error(res, '请输入需要分析的题目', 400);
    const result = await aiService.cetAnalysis(question, type || 'cet4');
    const analysis = (result.success && result.data) ? result.data : (result.error || 'Analysis failed');
    success(res, { analysis }, '分析完成');
  } catch (err) { next(err); }
};
