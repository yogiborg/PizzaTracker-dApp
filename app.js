let provider;
let signer;

console.log("🚀 app.js loaded");
console.log("👀 STORE_WALLET from config.js:", STORE_WALLET);

document.getElementById("connectWallet").onclick = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const address = await signer.getAddress();
    document.getElementById("walletAddress").innerText = address;
    document.getElementById("output").innerText = "✅ Wallet connected!";
    console.log("🔌 Wallet connected:", address);
  } else {
    alert("Please install MetaMask!");
  }
};

document.getElementById("signStageUpdate").onclick = async () => {
  if (!signer) return alert("Please connect wallet first.");

  const orderId = document.getElementById("orderId").value.trim();
  const stage = document.getElementById("stageSelect").value;
  const timestamp = new Date().toLocaleString();

  // Order ID for stage = "Ordered"
  if (stage === "Ordered") {
    const allOrders = JSON.parse(localStorage.getItem("pizzaUpdates") || "{}");
    if (Object.keys(allOrders).includes(orderId)) {
      alert(`Order #${orderId} already exists. Can't re-place it.`);
      return;
    }

    const customerOrders = JSON.parse(localStorage.getItem("customerOrders") || "[]");
    const orderExists = customerOrders.some(order => order.orderId === orderId);
    if (!orderExists) {
      alert(`❌ Order ID #${orderId} not found. Cannot mark as 'Ordered'.`);
      return;
    }
  }

  // Stage uniqueness and order
  const updates = JSON.parse(localStorage.getItem("pizzaUpdates") || "{}");
  const previousUpdates = updates[orderId] || [];

  if (previousUpdates.some(u => u.stage === stage)) {
    alert(`Stage '${stage}' has already been logged for Order #${orderId}.`);
    return;
  }

  const STAGE_ORDER = ["Ordered", "DoughMade", "ToppingsAdded", "Baked", "OutForDelivery", "Delivered"];
  const lastStageIndex = previousUpdates.length > 0
    ? STAGE_ORDER.indexOf(previousUpdates[previousUpdates.length - 1].stage)
    : -1;
  const currentStageIndex = STAGE_ORDER.indexOf(stage);

  if (currentStageIndex !== lastStageIndex + 1) {
    alert(`Stage '${stage}' is out of order. The next valid stage is '${STAGE_ORDER[lastStageIndex + 1] || "none"}'.`);
    return;
  }

  // If all checks pass, proceed
  const message = `Order #${orderId} reached '${stage}' at ${timestamp}`;

  try {
    const signature = await signer.signMessage(message);
    document.getElementById("output").innerText =
      `✅ Signed!\n\nMessage:\n${message}\n\nSignature:\n${signature}`;

    const update = { stage, timestamp, message, signature };
    if (!updates[orderId]) {
      updates[orderId] = [];
    }
    updates[orderId].push(update);
    localStorage.setItem("pizzaUpdates", JSON.stringify(updates));

    displayUpdates(orderId);
  } catch (err) {
    console.error(err);
    document.getElementById("output").innerText = "❌ Signing failed.";
  }
};

document.getElementById("verifyBtn").onclick = () => {
  const message = document.getElementById("verifyMessage").value;
  const signature = document.getElementById("verifySignature").value;

  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    const normalized = recoveredAddress.toLowerCase();

    const result = (normalized === STORE_WALLET.toLowerCase())
      ? `✅ Verified store signature: ${recoveredAddress}`
      : `❌ Signature valid but NOT from store. Recovered: ${recoveredAddress}`;

    document.getElementById("verifyOutput").innerText = result;
    console.log("🔍 Verification result:", result);
  } catch (err) {
    console.error("❌ Verification error:", err);
    document.getElementById("verifyOutput").innerText = "❌ Invalid signature.";
  }
};

document.getElementById("resetOrders").onclick = () => {
  const confirmReset = confirm("Are you sure you want to delete all order data?");
  if (confirmReset) {
    localStorage.removeItem("pizzaUpdates");
    document.getElementById("timeline").innerHTML = "";
    document.getElementById("output").innerText = "🧹 All orders cleared.";
    console.log("🗑 Cleared localStorage");
  }
};

document.getElementById("downloadJson").onclick = () => {
  const updates = localStorage.getItem("pizzaUpdates");
  if (!updates) {
    alert("No order data to download.");
    return;
  }

  const blob = new Blob([updates], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pizzaOrders.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log("💾 Downloaded pizzaOrders.json");
};

document.getElementById("loadFromIpfs").onclick = async () => {
  const url = document.getElementById("ipfsUrl").value.trim();
  const output = document.getElementById("ipfsLoadOutput");

  console.log("🌐 Attempting to fetch:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch from IPFS");

    const data = await res.json();
    console.log("📦 JSON fetched:", data);

    // Handle flat format (single order)
    if (data.message && data.signature) {
      const recovered = ethers.utils.verifyMessage(data.message, data.signature);
      const verified = recovered.toLowerCase() === STORE_WALLET;

      output.innerText =
        `🧾 Order from ${data.customer}Order Id:${data.orderId}\nItems: ${data.items}\nTime: ${data.timestamp}\n\nMessage:\n${data.message}\n\nSignature:\n${data.signature}\n\n` +
        (verified ? `✅ Verified signature from: ${recovered}` : `❌ Invalid signer: ${recovered}`);

      return;
    }

    // Else assume legacy pizzaUpdates format
    const orderIds = Object.keys(data);
    if (orderIds.length === 0) {
      output.innerText = "❌ No order data found in file.";
      return;
    }

    for (let orderId of orderIds) {
      const updates = data[orderId];
      for (let update of updates) {
        const recovered = ethers.utils.verifyMessage(update.message, update.signature);
        update.verified = recovered.toLowerCase() === STORE_WALLET;
      }
    }

    const existing = JSON.parse(localStorage.getItem("pizzaUpdates") || "{}");
    for (let orderId in data) {
      if (!existing[orderId]) existing[orderId] = [];
      existing[orderId] = [...existing[orderId], ...data[orderId]];
    }

    localStorage.setItem("pizzaUpdates", JSON.stringify(existing));
    displayUpdates(orderIds[0]);
    output.innerText = `✅ Loaded and verified Order #${orderIds[0]}`;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    output.innerText = "❌ Failed to load or verify order.";
  }
};


function displayUpdates(orderId) {
  const updates = JSON.parse(localStorage.getItem("pizzaUpdates") || "{}");
  const orderUpdates = updates[orderId] || [];

  let html = `<h3>📜 Order #${orderId} Timeline</h3>`;
  if (orderUpdates.length === 0) {
    html += "<p>No updates yet.</p>";
  } else {
    html += "<ul>";
    for (let update of orderUpdates) {
      html += `<li>
        <b>${update.stage}</b> at ${update.timestamp}<br>
        <code>${update.message}</code><br>
        <small>Signature: ${update.signature.slice(0, 16)}... </small>
        ${update.verified ? "<b>✅ Store-verified</b>" : ""}
      </li>`;
    }
    html += "</ul>";
  }

  document.getElementById("timeline").innerHTML = html;
}

// Auto-load
window.onload = () => {
  const orderId = document.getElementById("orderId").value;
  if (orderId) displayUpdates(orderId);
};
