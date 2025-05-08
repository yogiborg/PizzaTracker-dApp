window.onload = () => {
  document.getElementById("placeOrder").onclick = async () => {
    console.log("🟦 Place Order button clicked");

    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("🟩 Wallet address:", address);

      const name = document.getElementById("customerName").value.trim();
      const items = document.getElementById("orderItems").value.trim();
      const timestamp = new Date().toLocaleString();

      if (!name || !items) {
        alert("Please enter both your name and order items.");
        return;
      }

      const message = `Customer ${name} placed an order: ${items} at ${timestamp}`;
      console.log("🟨 Message to sign:", message);

      console.log("🛎 Requesting signature from MetaMask...");
      const signature = await signer.signMessage(message);
      console.log("✍️ Signature captured:", signature);

      const orderId = Date.now().toString();
      const order = {
        orderId,
        customer: name,
        items,
        timestamp,
        message,
        signature,
        from: address
      };

      const orders = JSON.parse(localStorage.getItem("customerOrders") || "[]");
      orders.push(order);
      localStorage.setItem("customerOrders", JSON.stringify(orders));

      document.getElementById("orderOutput").innerText =
        `✅ Order submitted and signed by ${address}\n\n${message}\n\n🆔 Order ID: ${orderId}`;
      
      console.log("✅ Final order object:", order);

    } catch (err) {
      console.error("❌ Signing failed:", err);
      document.getElementById("orderOutput").innerText = "❌ Signing failed: " + err.message;
    }
  };

  document.getElementById("downloadLatestOrder").onclick = () => {
    const orders = JSON.parse(localStorage.getItem("customerOrders") || "[]");
    if (orders.length === 0) {
      return alert("No orders found.");
    }

    const latestOrder = orders[orders.length - 1];
    const blob = new Blob([JSON.stringify(latestOrder, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const safeName = latestOrder.customer.replace(/\s+/g, "_").toLowerCase();
    const filename = `signed-order-${safeName}-${latestOrder.orderId}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Needed for Firefox
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    console.log("💾 Download triggered for:", filename);
  };
};