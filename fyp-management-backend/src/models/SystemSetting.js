const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

systemSettingSchema.statics.get = async function (key, defaultValue = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultValue;
};

systemSettingSchema.statics.set = async function (key, value, userId = null) {
  return this.findOneAndUpdate(
    { key },
    { value, updatedBy: userId, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
