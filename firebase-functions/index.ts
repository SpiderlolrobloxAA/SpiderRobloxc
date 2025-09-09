import * as functions from "firebase-functions";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

export const createUserProfile = functions.auth
  .user()
  .onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email || null;
    const username = (user.displayName ||
      (email ? email.split("@")[0] : "user")) as string;

    const ref = db.doc(`users/${uid}`);
    await ref.set(
      {
        email,
        username,
        role: "user",
        balances: { available: 0, pending: 0 },
        quests: { completed: [], progress: {} },
        stats: {
          sales: 0,
          purchases: 0,
          joinedAt: FieldValue.serverTimestamp(),
        },
        lastSeen: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

// Process salePending transactions: mark seller pending, then after delay redistribute 70/30
export const processSalePending = require("firebase-functions").firestore
  .document("transactions/{txId}")
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    if (!data) return;
    if (data.type !== "salePending") return;

    const txId = ctx.params.txId;
    const credits = Number(data.credits || 0);
    const sellerId = data.uid || data.sellerId || null;

    if (!sellerId || credits <= 0) return;

    const txRef = db.collection("transactions").doc(txId);

    try {
      // increment seller pending balance
      await db.collection("users").doc(sellerId).set(
        { balances: { pending: FieldValue.increment(credits) } },
        { merge: true },
      );

      // schedule redistribution after ~90 seconds
      const delayMs = 90 * 1000;
      setTimeout(async () => {
        try {
          const sellerShare = Math.floor((credits * 70) / 100);
          const founderShare = credits - sellerShare;

          // move pending -> available for seller
          await db.collection("users").doc(sellerId).set(
            { balances: { pending: FieldValue.increment(-credits), available: FieldValue.increment(sellerShare) } },
            { merge: true },
          );

          // credit founder (first found)
          const foundersSnap = await db.collection("users").where("role", "==", "founder").limit(1).get();
          if (!foundersSnap.empty) {
            const founderId = foundersSnap.docs[0].id;
            await db.collection("users").doc(founderId).set(
              { balances: { available: FieldValue.increment(founderShare) } },
              { merge: true },
            );
            // record founder transaction
            await db.collection("transactions").add({
              uid: founderId,
              type: "saleReleased",
              credits: founderShare,
              status: "completed",
              createdAt: FieldValue.serverTimestamp(),
              note: `Commission from sale ${txId}`,
            });
          }

          // update original transaction status to completed
          await txRef.update({ status: "completed", releasedAt: FieldValue.serverTimestamp() });

          // record seller released transaction
          await db.collection("transactions").add({
            uid: sellerId,
            type: "saleReleased",
            credits: sellerShare,
            status: "completed",
            createdAt: FieldValue.serverTimestamp(),
            note: `Sale distribution for ${txId}`,
          });
        } catch (err) {
          console.error("processSalePending failed", err);
        }
      }, delayMs);
    } catch (e) {
      console.error("processSalePending:onCreate error", e);
    }
  });
