function a(e) {
  e.onMessage("add-new-row", (o) => {
    console.log("Add new row message received with payload:", o);
  });
}
export {
  a as default
};
