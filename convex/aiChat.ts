import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ensureChat = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title }) => {
    const existing = await ctx.db
      .query("aiChats")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .first();
    if (existing) return existing._id;
    const chatId = await ctx.db.insert("aiChats", {
      userId,
      title: title ?? "Assistant",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return chatId;
  }
});

export const appendMessages = mutation({
  args: {
    chatId: v.id("aiChats"),
    messages: v.array(v.object({
      role: v.string(),
      parts: v.array(v.any()),
    })),
  },
  handler: async (ctx, { chatId, messages }) => {
    for (const m of messages) {
      await ctx.db.insert("aiMessages", {
        chatId,
        role: m.role as any,
        parts: m.parts,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(chatId, { updatedAt: Date.now() });
  }
});

export const logEvent = mutation({
  args: {
    userId: v.optional(v.id("users")),
    chatId: v.optional(v.id("aiChats")),
    eventType: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiEvents", {
      ...args,
      createdAt: Date.now(),
    });
  }
});

export const getChat = query({
  args: { chatId: v.id("aiChats") },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) return null;
    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_chat", q => q.eq("chatId", chatId))
      .collect();
    return { chat, messages };
  }
});

export const listChats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("aiChats")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  }
});

export const createChat = mutation({
  args: { userId: v.id("users"), title: v.optional(v.string()) },
  handler: async (ctx, { userId, title }) => {
    const count = await ctx.db
      .query("aiChats")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    const chatId = await ctx.db.insert("aiChats", {
      userId,
      title: title ?? `Chat ${count.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return chatId;
  }
});

export const renameChat = mutation({
  args: { chatId: v.id("aiChats"), title: v.string() },
  handler: async (ctx, { chatId, title }) => {
    await ctx.db.patch(chatId, { title, updatedAt: Date.now() });
  }
});

export const deleteChat = mutation({
  args: { chatId: v.id("aiChats") },
  handler: async (ctx, { chatId }) => {
    const msgs = await ctx.db
      .query("aiMessages")
      .withIndex("by_chat", q => q.eq("chatId", chatId))
      .collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }
    await ctx.db.delete(chatId);
  }
});

export const listChatsWithStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
    const result: Array<{ _id: string; title?: string; createdAt: number; updatedAt: number; messageCount: number }> = [];
    for (const c of chats) {
      const count = (await ctx.db
        .query("aiMessages")
        .withIndex("by_chat", q => q.eq("chatId", c._id))
        .collect()).length;
      result.push({ _id: c._id, title: (c as any).title, createdAt: (c as any).createdAt, updatedAt: (c as any).updatedAt, messageCount: count });
    }
    return result;
  }
});


