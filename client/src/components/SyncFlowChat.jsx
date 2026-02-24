import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const SyncFlowChat = () => {
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Online");
  const [messages, setMessages] = useState([]);

  const sendToBackend = async (data) => {
    const res = await axios.post("http://localhost:5000/api/messages", data);
    return res.data;
  };

  const saveOffline = (data) => {
    const old =
      JSON.parse(localStorage.getItem("offlineMsgs")) || [];
    old.push(data);
    localStorage.setItem("offlineMsgs", JSON.stringify(old));
  };

  const handleSend = async () => {
    if (!shopName || !address || !phone) return;

    const data = { shopName, address, phone };

    if (navigator.onLine) {
      const saved = await sendToBackend(data);
      socket.emit("sendMessage", saved);
      setStatus("✔ Sent (Online)");
    } else {
      saveOffline(data);

      setMessages((prev) => [
        ...prev,
        { ...data, localStatus: "offline" },
      ]);

      setStatus("🟡 Saved Offline");
    }

    setShopName("");
    setAddress("");
    setPhone("");
  };

  const syncData = async () => {
    const data =
      JSON.parse(localStorage.getItem("offlineMsgs")) || [];

    if (data.length > 0) {
      for (let msg of data) {
        const saved = await sendToBackend(msg);
        socket.emit("sendMessage", saved);
      }

      localStorage.removeItem("offlineMsgs");
      setStatus("🟢 Synced Successfully");
    }
  };

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          shopName: data.shopName,
          address: data.address,
          phone: data.phone,
          localStatus: "sent",
        },
      ]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  useEffect(() => {
    const onlineHandler = () => {
      setStatus("Online");
      syncData();
    };

    const offlineHandler = () => {
      setStatus("🔴 Offline Mode");
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">

      {/* 🔥 RESPONSIVE CONTAINER */}
      <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto">

        {/* LEFT FORM */}
        <div className="bg-white w-full md:w-[380px] p-4 md:p-6 rounded-2xl shadow-xl">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-3">
            Mobile Shop Sync
          </h1>

          <p className="text-center text-sm mb-4 text-blue-600 font-semibold">
            Status: {status}
          </p>

          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Mobile Shop Name"
            className="border w-full p-2 rounded mb-2"
          />

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            className="border w-full p-2 rounded mb-2"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            className="border w-full p-2 rounded mb-3"
          />

          <button
            onClick={handleSend}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Send Data
          </button>
        </div>

        {/* RIGHT CHAT */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 h-[400px] md:h-[500px] overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">
            Sent Data (WhatsApp Style)
          </h2>

          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm">No messages yet...</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className="bg-green-100 ml-auto mb-3 p-3 rounded-2xl max-w-[85%] md:max-w-[70%] shadow-md"
              >
                <p className="font-semibold text-gray-800">
                  {msg.shopName}
                </p>
                <p className="text-sm text-gray-700">
                  {msg.address}
                </p>
                <p className="text-sm text-gray-700">
                  {msg.phone}
                </p>

                <p className="text-xs text-right mt-1 text-gray-500">
                  {msg.localStatus === "offline" && "🟡 Offline"}
                  {msg.localStatus === "sent" && "✔ Sent"}
                  {msg.localStatus === "synced" && "🟢 Synced"}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default SyncFlowChat;