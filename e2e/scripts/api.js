// Maestro runScript helpers. The mock fails on purpose, so every call retries with the same key.
var BASE = "https://dev.zahln.de";
var CANDIDATE = "c_b948552f5f";

function call(method, path, token, body, key) {
  var headers = { "X-Candidate-Id": CANDIDATE, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (key) headers["Idempotency-Key"] = key;
  if (method === "POST" && path.indexOf("/payments") > 0) headers["X-App-Version"] = "1.0.0";
  for (var attempt = 0; attempt < 8; attempt++) {
    var res =
      method === "GET"
        ? http.get(BASE + path, { headers: headers })
        : http.post(BASE + path, { headers: headers, body: JSON.stringify(body) });
    if (res.status >= 200 && res.status < 300) return json(res.body);
    if (res.status < 500 && res.status !== 0)
      throw new Error(method + " " + path + " → " + res.status + " " + res.body);
  }
  throw new Error(method + " " + path + " kept failing");
}

function login(username) {
  return call("POST", "/sessions", null, { username: username, password: "test1234" }).accessToken;
}

function newKey() {
  return "e2e-" + Date.now() + "-" + Math.floor(Math.random() * 1e9);
}

// ACTION picks what this run does; Maestro passes it with `env`.
if (ACTION === "create_order") {
  var cashierToken = login(typeof CASHIER !== "undefined" ? CASHIER : "cashier-campus-1");
  var order = call(
    "POST",
    "/orders",
    cashierToken,
    {
      items: [
        { itemId: "item_campus_pasta", quantity: 1 },
        { itemId: "item_campus_salad", quantity: 1 },
      ],
    },
    newKey(),
  );
  output.orderId = order.id;
  output.student = order.amounts.student;
  output.staff = order.amounts.staff;
  output.guest = order.amounts.guest;
} else if (ACTION === "assert_one_payment") {
  var payments = call("GET", "/payments?q=" + ORDER_ID, login("finance")).items;
  var confirmed = payments.filter(function (p) {
    return p.status === "confirmed";
  });
  if (payments.length !== 1 || confirmed.length !== 1) {
    throw new Error(
      "Expected exactly 1 confirmed payment for " + ORDER_ID + ", found " + payments.length,
    );
  }
} else {
  throw new Error("Unknown ACTION " + ACTION);
}
