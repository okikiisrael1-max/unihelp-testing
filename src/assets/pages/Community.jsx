import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore";

import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
} from "firebase/database";

import { db, auth } from "../../firebase/config";

import {
  AtSign,
  CheckCheck,
  Clock3,
  Reply,
  School,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  User2,
  X,
} from "lucide-react";

/* =========================================================
   CONFIG
========================================================= */

const ROOM_ID = "campus-global";

const MESSAGE_LIMIT = 15;

const EMOJIS = [
  "🔥",
  "❤️",
  "😂",
  "👍",
  "😭",
  "🎉",
  "😎",
  "🙏",
];

/* =========================================================
   MESSAGE BUBBLE
========================================================= */

const MessageBubble = memo(
  ({
    message,
    isMe,
    theme,
    setReplyingTo,
    addReaction,
  }) => {
    return (
      <div
        className={`flex ${
          isMe
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className={`max-w-[96%] sm:max-w-[92%] md:max-w-[72%] flex gap-3 ${
            isMe
              ? "flex-row-reverse"
              : ""
          }`}
        >
          {/* AVATAR */}

          {message.avatar ? (
            <img
              src={message.avatar}
              alt=""
              className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <User2 size={18} />
            </div>
          )}

          {/* BODY */}

          <div className="max-w-full">
            {/* NAME */}

            <div
              className={`mb-1 flex items-center gap-2 ${
                isMe
                  ? "justify-end"
                  : ""
              }`}
            >
              <p className="text-xs font-semibold opacity-80 truncate">
                {message.name}
              </p>

              <span className="text-[10px] opacity-50">
                {message.createdAt
                  ?.toDate?.()
                  ?.toLocaleTimeString(
                    [],
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit",
                    }
                  )}
              </span>
            </div>

            {/* MESSAGE */}

            <div
              className={`relative overflow-hidden rounded-[28px] border shadow-2xl px-4 md:px-5 py-4 ${
                isMe
                  ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white border-transparent rounded-br-md"
                  : `${theme.bubble} ${theme.border} rounded-bl-md`
              }`}
            >
              {/* REPLY */}

              {message.replyTo && (
                <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 p-3 overflow-hidden">
                  <p className="text-xs opacity-60">
                    Replying to{" "}
                    {
                      message.replyTo
                        .name
                    }
                  </p>

                  <p className="text-sm truncate">
                    {
                      message.replyTo
                        .text
                    }
                  </p>
                </div>
              )}

              {/* TEXT */}

              <p className="leading-7 whitespace-pre-wrap break-all text-sm md:text-[15px]">
                {message.text
                  ?.split(" ")
                  .map(
                    (
                      word,
                      index
                    ) =>
                      word.startsWith(
                        "@"
                      ) ? (
                        <span
                          key={
                            index
                          }
                          className="text-cyan-300 font-semibold"
                        >
                          {word}{" "}
                        </span>
                      ) : (
                        word +
                        " "
                      )
                  )}
              </p>

              {/* REACTIONS */}

{message.reactions &&
  Array.isArray(message.reactions) &&
  message.reactions.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-4">
      {Object.entries(
        message.reactions.reduce(
          (acc, reaction) => {
            const emoji =
              reaction?.emoji;

            if (!emoji)
              return acc;

            acc[emoji] =
              (acc[emoji] || 0) + 1;

            return acc;
          },
          {}
        )
      ).map(
        ([emoji, count]) => (
          <button
            key={emoji}
            className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm flex items-center gap-1 hover:bg-white/20 transition"
          >
            <span>{emoji}</span>

            <span className="text-xs opacity-70">
              {count}
            </span>
          </button>
        )
      )}
    </div>
  )}
              {/* ACTIONS */}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={() =>
                    setReplyingTo(
                      message
                    )
                  }
                  className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center gap-2 text-xs"
                >
                  <Reply
                    size={14}
                  />

                  Reply
                </button>

                {EMOJIS.map(
                  (
                    emoji
                  ) => (
                    <button
                      key={
                        emoji
                      }
                      onClick={() =>
                        addReaction(
                          message.id,
                          emoji
                        )
                      }
                      className="text-lg hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>

              {/* CHECK */}

              {isMe && (
                <div className="flex justify-end mt-2">
                  <CheckCheck
                    size={14}
                    className="opacity-70"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Community({
  dark = true,
}) {
  /* =========================================================
     STATES
  ========================================================= */

  const [messages, setMessages] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  const [text, setText] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [lastDoc, setLastDoc] =
    useState(null);

  const [replyingTo, setReplyingTo] =
    useState(null);

  const [showMentions, setShowMentions] =
    useState(false);

  const [mentionQuery, setMentionQuery] =
    useState("");

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const [typingUsers, setTypingUsers] =
    useState([]);

  const [onlineCount, setOnlineCount] =
    useState(0);

  const inputRef = useRef(null);

  const bottomRef = useRef(null);

  const typingTimeout =
    useRef(null);

  /* =========================================================
     THEME
  ========================================================= */

  const theme = {
    bg: dark
      ? "bg-[#050816]"
      : "bg-[#f5f7fb]",

    text: dark
      ? "text-white"
      : "text-black",

    sub: dark
      ? "text-white/60"
      : "text-black/60",

    glass: dark
      ? "bg-white/[0.05]"
      : "bg-white/70",

    border: dark
      ? "border-white/10"
      : "border-black/10",

    bubble: dark
      ? "bg-[#0f172a]"
      : "bg-white",
  };

  /* =========================================================
     REFS
  ========================================================= */

  const realtimeDb =
    getDatabase();

  const messagesRef =
    collection(
      db,
      "chats",
      ROOM_ID,
      "messages"
    );

  /* =========================================================
     ONLINE PRESENCE
  ========================================================= */

  useEffect(() => {
    const user =
      auth.currentUser;

    if (!user) return;

    const presenceRef =
      ref(
        realtimeDb,
        `presence/${ROOM_ID}/${user.uid}`
      );

    set(presenceRef, {
      online: true,
      name:
        user.displayName ||
        "Anonymous",
    });

    onDisconnect(
      presenceRef
    ).remove();

    const roomPresenceRef =
      ref(
        realtimeDb,
        `presence/${ROOM_ID}`
      );

    const unsubscribe =
      onValue(
        roomPresenceRef,
        (snapshot) => {
          const data =
            snapshot.val() ||
            {};

          setOnlineCount(
            Object.keys(data)
              .length
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     MEMBERS
  ========================================================= */

  useEffect(() => {
    const refCollection =
      collection(
        db,
        "rooms",
        ROOM_ID,
        "members"
      );

    const unsubscribe =
      onSnapshot(
        refCollection,
        (snapshot) => {
          const users =
            snapshot.docs.map(
              (docItem) => ({
                id: docItem.id,
                ...docItem.data(),
              })
            );

          setMembers(users);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     SAVE USER
  ========================================================= */

  useEffect(() => {
    const user =
      auth.currentUser;

    if (!user) return;

    setDoc(
      doc(
        db,
        "rooms",
        ROOM_ID,
        "members",
        user.uid
      ),
      {
        name:
          user.displayName ||
          "Anonymous",

        avatar:
          user.photoURL ||
          "",
      },
      { merge: true }
    );
  }, []);

  /* =========================================================
     TYPING
  ========================================================= */

  useEffect(() => {
    const typingRef = ref(
      realtimeDb,
      `typing/${ROOM_ID}`
    );

    const unsubscribe =
      onValue(
        typingRef,
        (snapshot) => {
          const data =
            snapshot.val() ||
            {};

          const users =
            Object.values(
              data
            ).filter(Boolean);

          setTypingUsers(
            users
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const sendTyping =
    useCallback(
      async (value) => {
        const user =
          auth.currentUser;

        if (!user)
          return;

        const typingRef =
          ref(
            realtimeDb,
            `typing/${ROOM_ID}/${user.uid}`
          );

        onDisconnect(
          typingRef
        ).remove();

        if (
          !value.trim()
        ) {
          remove(
            typingRef
          );

          return;
        }

        set(
          typingRef,
          {
            name:
              user.displayName ||
              "Someone",
          }
        );

        clearTimeout(
          typingTimeout.current
        );

        typingTimeout.current =
          setTimeout(
            () => {
              remove(
                typingRef
              );
            },
            1500
          );
      },
      []
    );

  /* =========================================================
     LOAD MESSAGES
  ========================================================= */

  useEffect(() => {
    const q = query(
      messagesRef,
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(
        MESSAGE_LIMIT
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {
          const data =
            snapshot.docs
              .map(
                (
                  docItem
                ) => ({
                  id: docItem.id,
                  ...docItem.data(),
                })
              )
              .reverse();

          setMessages(data);

          setLastDoc(
            snapshot.docs[
              snapshot.docs
                .length -
                1
            ]
          );

          setLoading(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
      }
    );
  }, [messages]);

  /* =========================================================
     LOAD MORE
  ========================================================= */

  const loadMore =
    async () => {
      if (!lastDoc)
        return;

      const q = query(
        messagesRef,
        orderBy(
          "createdAt",
          "desc"
        ),
        startAfter(
          lastDoc
        ),
        limit(15)
      );

      const snapshot =
        await getDocs(q);

      const older =
        snapshot.docs.map(
          (d) => ({
            id: d.id,
            ...d.data(),
          })
        );

      setMessages(
        (prev) => [
          ...older.reverse(),
          ...prev,
        ]
      );

      setLastDoc(
        snapshot.docs[
          snapshot.docs
            .length -
            1
        ]
      );
    };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage =
    async () => {
      if (
        !text.trim()
      )
        return;

      const user =
        auth.currentUser;

      if (!user)
        return;

      const mentions =
        text.match(
          /@\w+/g
        ) || [];

      await addDoc(
        messagesRef,
        {
          text:
            text.trim(),

          mentions,

          userId:
            user.uid,

          name:
            user.displayName ||
            "Anonymous",

          avatar:
            user.photoURL ||
            "",

          createdAt:
            serverTimestamp(),

          reactions:
            {},

          replyTo:
            replyingTo
              ? {
                  id:
                    replyingTo.id,

                  name:
                    replyingTo.name,

                  text:
                    replyingTo.text,
                }
              : null,
        }
      );

      setText("");

      setReplyingTo(
        null
      );

      setShowEmojiPicker(
        false
      );

      sendTyping(
        ""
      );
    };

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (
    value
  ) => {
    setText(value);

    sendTyping(
      value
    );

    if (
      inputRef.current
    ) {
      inputRef.current.style.height =
        "auto";

      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }

    const words =
      value.split(
        " "
      );

    const last =
      words[
        words.length -
          1
      ];

    if (
      last.startsWith(
        "@"
      )
    ) {
      setShowMentions(
        true
      );

      setMentionQuery(
        last.replace(
          "@",
          ""
        )
      );
    } else {
      setShowMentions(
        false
      );
    }
  };

  /* =========================================================
     FILTERED MEMBERS
  ========================================================= */

  const filteredMembers =
    useMemo(() => {
      return members.filter(
        (
          member
        ) =>
          member.name
            ?.toLowerCase()
            .includes(
              mentionQuery.toLowerCase()
            )
      );
    }, [
      members,
      mentionQuery,
    ]);

  /* =========================================================
     SELECT MENTION
  ========================================================= */

  const selectMention = (
    name
  ) => {
    const words =
      text.split(
        " "
      );

    words[
      words.length -
        1
    ] = `@${name}`;

    setText(
      words.join(
        " "
      ) + " "
    );

    setShowMentions(
      false
    );

    inputRef.current?.focus();
  };

  /* =========================================================
     REACTIONS
  ========================================================= */

  const addReaction =
    async (
      messageId,
      emoji
    ) => {
      const uid =
        auth
          .currentUser
          ?.uid;

      if (!uid)
        return;

      const messageRef =
        doc(
          db,
          "chats",
          ROOM_ID,
          "messages",
          messageId
        );

      await updateDoc(
        messageRef,
        {
          [`reactions.${emoji}`]:
            increment(
              1
            ),
        }
      );
    };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredMessages =
    useMemo(() => {
      return messages.filter(
        (m) =>
          m.text
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [
      messages,
      search,
    ]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className={`relative h-full md:pt-20 overflow-hidden flex flex-col ${theme.bg} ${theme.text}`}
    >
      {/* BG */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      {/* HEADER */}

      <div
        className={`relative z-20 border-b backdrop-blur-3xl ${theme.border} ${theme.glass} px-4 md:px-8 py-4`}
      >
        <div className="flex items-center justify-center">
              <p className={`text-xs ${theme.sub} mt-2`}>
                {onlineCount}{" "} online
              </p>
          {/* SEARCH */}

          <div
            className={`hidden md:flex items-center gap-3 rounded-2xl border px-4 py-3 ${theme.border} ${theme.glass}`}>
            <Search size={16}/>

            <input
              value={search}
              onChange={(
                e
              ) =>
                setSearch(
                  e.target
                    .value
                )
              }
              placeholder="Search messages..."
              className="bg-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* CHAT */}

      <div className="relative z-10 flex-1 overflow-y-auto px-3 md:px-8 py-5 space-y-5">
        {!loading && (
          <div className="flex justify-center">
            <button
              onClick={
                loadMore
              }
              className="px-4 py-2 rounded-full text-xs bg-white/10 hover:bg-white/20 transition"
            >
              Load older
            </button>
          </div>
        )}

        {/* TYPING */}

        {typingUsers.length >
          0 && (
          <div className="text-xs opacity-60 italic px-2">
            {
              typingUsers[0]
                ?.name
            }{" "}
            is typing...
          </div>
        )}

        {/* MESSAGES */}

        {filteredMessages.map(
          (
            message
          ) => (
            <MessageBubble
              key={
                message.id
              }
              message={
                message
              }
              theme={
                theme
              }
              isMe={
                message.userId ===
                auth
                  .currentUser
                  ?.uid
              }
              setReplyingTo={
                setReplyingTo
              }
              addReaction={
                addReaction
              }
            />
          )
        )}

        <div
          ref={bottomRef}
        />
      </div>

      {/* INPUT */}

      <div
        className={`relative z-20 border-t backdrop-blur-3xl ${theme.border} ${theme.glass} px-3 md:px-8 py-4`}
      >
        {/* REPLY */}

        {replyingTo && (
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/10 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs opacity-60">
                Replying to{" "}
                {
                  replyingTo.name
                }
              </p>

              <p className="text-sm truncate">
                {
                  replyingTo.text
                }
              </p>
            </div>

            <button
              onClick={() =>
                setReplyingTo(
                  null
                )
              }
            >
              <X
                size={18}
              />
            </button>
          </div>
        )}

        {/* MENTIONS */}

        {showMentions &&
          filteredMembers.length >
            0 && (
            <div
              className={`absolute bottom-24 left-3 md:left-8 w-[90%] max-w-[320px] overflow-hidden rounded-3xl border backdrop-blur-3xl ${theme.border} ${theme.glass}`}
            >
              {filteredMembers
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    member
                  ) => (
                    <button
                      key={
                        member.id
                      }
                      onClick={() =>
                        selectMention(
                          member.name
                        )
                      }
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition"
                    >
                      {member.avatar ? (
                        <img
                          src={
                            member.avatar
                          }
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <User2
                            size={
                              18
                            }
                          />
                        </div>
                      )}

                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {
                            member.name
                          }
                        </p>

                        <p className="text-xs opacity-60">
                          Mention
                          user
                        </p>
                      </div>
                    </button>
                  )
                )}
            </div>
          )}

        {/* INPUT BAR */}

        <div
          className={`rounded-[30px] border p-2 flex items-end gap-3 ${theme.border} ${theme.glass}`}
        >
          {/* EMOJI */}

          <button
            onClick={() =>
              setShowEmojiPicker(
                (
                  prev
                ) =>
                  !prev
              )
            }
            className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center shrink-0"
          >
            <Smile
              size={20}
            />
          </button>

          {/* EMOJI PICKER */}

          {showEmojiPicker && (
            <div className="absolute bottom-24 left-3 md:left-8 w-[300px] rounded-3xl border border-white/10 bg-[#0f172a] p-4 flex flex-wrap gap-3 shadow-2xl">
              {EMOJIS.map(
                (
                  emoji
                ) => (
                  <button
                    key={
                      emoji
                    }
                    onClick={() => setText((prev) =>prev +emoji)}
                    className="text-2xl hover:scale-125 transition">
                    {
                      emoji
                    }
                  </button>
                )
              )}
            </div>
          )}

          {/* TEXTAREA */}

          <textarea ref={inputRef} rows={1} value={text} onChange={(
              e
            ) =>
              handleChange(
                e.target
                  .value
              )
            }
            placeholder="Message Unihelp..."
            className="flex-1 bg-transparent outline-none resize-none max-h-40 py-3 text-sm"
            onKeyDown={(
              e
            ) => {
              if (
                e.key ===
                  "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();

                sendMessage();
              }
            }}
          />

          {/* SEND */}

          <button
            onClick={
              sendMessage
            }
            disabled={
              !text.trim()
            }
            className="h-11 w-11 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:scale-105 transition disabled:opacity-50 shrink-0 flex items-center justify-center"
          >
            <SendHorizontal
              size={18}
            />
          </button>
        </div>

        {/* FOOTER */}

        <div className="mt-3 flex items-center justify-between px-2 text-xs opacity-60 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock3
              size={13}
            /> Connect with students all over campuses
          </div>

          <div className="flex items-center gap-2">
            <AtSign
              size={13}
            />

            Use @ to mention
          </div>
        </div>
      </div>
    </div>
  );
}