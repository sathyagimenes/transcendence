import { ChatCommunication } from "../communication/chat.mjs";
import { ChatService } from "../services/chat.mjs";
import { RequestFailedError } from "../services/errors.mjs";
import { session } from "../state/session.mjs";
import { Button } from "./Button.mjs";
import { attachBootstrap, Component } from "./component.mjs";
import { Input } from "./Input.mjs";
import { Loading } from "./Loading.mjs";
import { TConditional } from "./TConditional.mjs";

export class TChat extends HTMLElement {
  static observedAttributes = [];

  /** @type {Loading} */
  t_loading;

  /** @type {Button} */
  t_chat_title;

  /** @type {Input} */
  t_input;

  /** @type {TConditional} */
  t_conditional_show_chat;

  /** @type {Component} */
  form;

  /** @type {Component} */
  container;

  /** @type {Component} */
  messages_container;

  /** @type {import("../services/chat.mjs").Chat} */
  chat;

  constructor() {
    super();
    this.container = new Component("div").class(
      "border border-secondary p-2 rounded h-100",
    );
    this.container.element.innerHTML = `
      <t-conditional condition="false">
        <t-loading slot="if" id="loading-chat" loading="true" style="min-height: 70vh;">
          <span id="chat-title" theme="secondary" bg-secondary class="w-100" btn-class="w-100 text-start rounded-top rounded-bottom-0"></span>

          <div id="chat" class="d-flex flex-column gap-1  p-2 rounded bg-secondary overflow-y-auto mb-3" style="height: 70vh;">
          </div>

          <form class="d-flex gap-1 p-2 mt-3  rounded">
            <t-input label="Mensagem" class="col-8"></t-input>

            <t-button class="d-block col-4" btn-class="w-100 h-100" theme="info">Enviar</t-button>
          </form>
        </t-loading>
        <div slot="else" class=" p-2 rounded overflow-y-auto mb-3" style="height: 70vh;">
          Nenhuma conversa selecionada
        </div>
      </t-conditional>
    `;

    this.t_chat_title =
      this.container.element.querySelector("#chat-title");
    this.form = new Component(this.container.element.querySelector("form"));
    this.t_input = this.container.element.querySelector("t-input");
    this.t_conditional_show_chat =
      this.container.element.querySelector("t-conditional");
    this.t_loading = this.container.element.querySelector("#loading-chat");
    this.messages_container = new Component(
      this.container.element.querySelector("#chat"),
    );

    this.form.addEventListener("submit", async () => {
      if (!ChatCommunication.Communication.isOpen()) return;
      const t_button = this.form.element.querySelector("t-button");
      this.t_input.clearErrors();

      const message = this.t_input.value;
      if (!message) return;

      this.t_input.value = "";
      try {
        t_button.setLoading(true);
        await ChatService.sendMessage({
          chat_id: this.chat.id,
          sender_id: session.player.id,
          text: message,
        });
        this.t_input.focus();
      } catch (error) {
        if (error instanceof RequestFailedError) {
          this.t_input.addErrors(error.data?.error?.message);
          this.t_input.value = message;
          this.t_input.focus();
        }
      } finally {
        t_button.setLoading(false);
      }
    });
  }

  /**
   * @param {import("../services/chat.mjs").Chat} chat
   * @param {(message: import("../services/chat.mjs").Message) => void} onNewMessage
   */
  setChat(chat, onNewMessage) {
    this.t_loading.setLoading(true);
    this.t_conditional_show_chat.setCondition(true);
    this.chat = chat;
    ChatCommunication.Communication.disconnect(() => {
      ChatCommunication.Communication.setPath("/ws/chat/" + this.chat.id);

      ChatCommunication.Communication.connect(() => {
        const participants = this.chat.players.filter(
          (p) => p.id !== session.player.id,
        );

        this.t_chat_title.textContent = participants
          .map((p) => p.name)
          .join(" ");

        if (this.chat.is_private) {
          this.t_chat_title.setAttribute(
            "to",
            "/auth/player/profile?player=" + participants[0].id,
          );
        }

        this.t_input.value = "";
        this.messages_container.clear();
        this.appendMessages(this.chat.messages);

        ChatCommunication.Communication.addEventListener(
          ChatCommunication.Events.CHAT_MESSAGE,
          (message) => {
            onNewMessage(message);
            this.appendMessages(message);
            this.showMessage(message);
          },
        );
        this.t_loading.setLoading(false);
        this.t_input.focus();
        const lastMessage = this.chat.messages.at(-1);
        if (lastMessage) this.showMessage(lastMessage);
      });
    });
  }

  /**
   *  @param {import("../services/chat.mjs").Message} message
   */
  showMessage(message) {
    this.messages_container.element
      .querySelector(`[data-id="${message.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  /**
   *  @param {import("../services/chat.mjs").Message | import("../services/chat.mjs").Message[]} messages
   */
  appendMessages(messages) {
    if (!Array.isArray(messages)) messages = [messages];

    messages.forEach((message) =>
      this.messages_container.children([
        new Component("span", {
          textContent: message.text,
        })
          .attributes({ "data-id": message.id })
          .class("d-inline-block flex-grow-0 text-break py-2 px-4 rounded")
          .class(
            message.sender.id === session.player.id
              ? "bg-secondary-subtle align-self-end"
              : "bg-info-subtle align-self-start",
          ),
      ]),
    );
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.container.element);
  }

  disconnectedCallback() {
    ChatCommunication.Communication.disconnect();
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  async closeChat() {
    if (this.chat) {
      this.t_loading.setLoading(true);
      try {
        ChatCommunication.Communication.disconnect();
        this.chat = null;

        this.t_conditional_show_chat.setCondition(false);
        this.messages_container.clear();
        this.t_chat_title.textContent = "Nenhuma conversa selecionada";
        this.t_input.value = "";

      } catch (error) {
        console.error('Erro ao fechar o chat:', error);
      } finally {
        this.t_loading.setLoading(false);
      }
    }
  }

}
