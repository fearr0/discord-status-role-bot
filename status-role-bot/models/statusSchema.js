const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    guildID: { type: String, required: true },
    statusRole: { type: String, default: null },
    statusMode: { type: Boolean, default: false },
    statusKeywords: { type: [String], default: [] }
    // Bu statusKeywords datasına bir komut yaparsınız mesela
    // .ekle kaldır ona göre sistem çalışır yinede
    // istemezseniz ise default: [".gg/xxx"] girebilirsiniz.
});

module.exports =
    mongoose.models.SetupSettings ||
    mongoose.model("SetupSettings", statusSchema);
