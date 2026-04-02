<template>
  <div class="h-screen grid grid-cols-12 gap-2 p-2">
    <aside class="col-span-3 bg-slate-800 rounded-lg p-4">
      <h2 class="text-xl font-bold mb-4">Discord Gaming Plus</h2>
      <input
        v-model="username"
        class="w-full px-3 py-2 rounded-lg mb-3 text-slate-900"
        placeholder="Pseudo"
      />
      <div class="space-y-2">
        <button
          @click="joinChat"
          class="w-full bg-indigo-500 hover:bg-indigo-600 rounded-lg py-2"
        >
          Rejoindre
        </button>
      </div>
      <div class="mt-6">
        <h3 class="font-semibold mb-2">Quiz en temps réel</h3>
        <div
          v-for="q in questions"
          :key="q.id"
          class="mb-3 p-2 bg-slate-900 rounded-lg"
        >
          <p class="text-sm">{{ q.q }}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="(a, idx) in q.answers"
              :key="idx"
              @click="sendAnswer(q.id, idx)"
              class="text-xs bg-slate-700 hover:bg-slate-600 rounded-md px-2 py-1"
            >
              {{ a }}
            </button>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <h3 class="font-semibold">Leaderboard</h3>
        <ul class="mt-2 space-y-1 text-xs">
          <li
            v-for="entry in leaderBoard"
            :key="entry.player"
            class="flex justify-between"
          >
            <span>{{ entry.player }}</span
            ><span>{{ entry.bestScore }}</span>
          </li>
        </ul>
      </div>
    </aside>

    <main class="col-span-9 grid grid-rows-[1fr_auto] gap-2">
      <div
        class="bg-slate-800 rounded-lg p-4 overflow-y-auto"
        ref="chatBox"
        style="max-height: calc(100vh - 170px)"
      >
        <div v-for="(m, i) in messages" :key="i" class="mb-2">
          <span class="font-semibold text-indigo-300">{{ m.author }}</span>
          <span class="text-slate-200">: {{ m.content }}</span>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg p-4">
        <div class="flex gap-2">
          <input
            v-model="message"
            @keyup.enter="sendMessage"
            class="flex-1 px-3 py-2 rounded-lg text-slate-900"
            placeholder="Votre message..."
          />
          <button
            @click="sendMessage"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
          >
            Envoyer
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      username: localStorage.getItem("username") || "",
      message: "",
      messages: [],
      questions: [
        {
          id: 1,
          q: "Quel est le moteur de templates de Vue 3 ?",
          answers: ["JSX", "No template", "Vue compiler"],
        },
        {
          id: 2,
          q: "Socket.io fonctionne sur la couche ?",
          answers: ["HTTP", "WebSocket"],
        },
        { id: 3, q: "MySQL est un SGBD ?", answers: ["NoSQL", "SQL"] },
      ],
      leaderBoard: [],
    };
  },
  mounted() {
    this.socket = io("http://localhost:3000");

    this.socket.on("connect", () => {
      console.log("Socket connecté", this.socket.id);
      this.fetchHistory();
      this.fetchLeaderboard();
    });

    this.socket.on("chat:message", (msg) => {
      this.messages.push(msg);
      this.$nextTick(() => {
        const node = this.$refs.chatBox;
        node.scrollTop = node.scrollHeight;
      });
    });

    this.socket.on("quiz:result", (payload) => {
      if (payload.correct) {
        this.messages.push({
          author: "Quiz",
          content: `${payload.player} a répondu correctement +1`,
        });
      } else {
        this.messages.push({
          author: "Quiz",
          content: `${payload.player} a échoué`,
        });
      }
      this.fetchLeaderboard();
    });
  },
  methods: {
    async fetchHistory() {
      const r = await fetch("http://localhost:3000/api/messages");
      this.messages = await r.json();
    },
    async fetchLeaderboard() {
      const r = await fetch("http://localhost:3000/api/leaderboard");
      this.leaderBoard = await r.json();
    },
    joinChat() {
      if (!this.username.trim()) return;
      localStorage.setItem("username", this.username);
      this.messages.push({
        author: "Systeme",
        content: `${this.username} a rejoint le chat.`,
      });
    },
    sendMessage() {
      if (!this.username.trim() || !this.message.trim()) return;

      this.socket.emit("chat:message", {
        author: this.username,
        content: this.message,
      });
      this.message = "";
    },
    sendAnswer(questionId, answerIndex) {
      if (!this.username.trim()) return;

      this.socket.emit("quiz:answer", {
        player: this.username,
        questionId,
        answerIndex,
      });
    },
  },
};
</script>

<style>
body {
  margin: 0;
}
</style>
