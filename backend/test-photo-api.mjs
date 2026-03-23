import fs from "fs";

async function run() {
  const email = `test${Date.now()}@test.com`;
  const pw = "Password123!";
  
  // Register
  let res = await fetch("http://localhost:4000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pw, firstName: "Test", lastName: "Test", phone: "123456" })
  });
  
  // Login
  res = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pw })
  });
  const loginData = await res.json();
  const token = loginData.token;

  // Create dummy image 1x1 black pixel
  const dummyImage = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
    "base64"
  );
  
  const formData = new FormData();
  formData.append("image", new Blob([dummyImage], { type: "image/png" }), "test.png");

  console.log("Sending to photo editor...");
  res = await fetch("http://localhost:4000/api/photo-editor/process", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  
  const data = await res.text();
  console.log("RESPONSE:", res.status, data);
}
run();
