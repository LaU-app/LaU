import api from "./api"; // Tu instancia de Axios configurada

export default {
    getContacts() {
    return api.get("/chat/contacts");
},
getMessages(userId) {
    return api.post("/chat/messages", { id: userId });
},
sendMessage(userId, message) {
    return api.post("/chat/send", {
    id: userId,
    message: message,
    type: "user",
    });
},
};
