import Quill from "quill";

const log = console.log.bind(console);

const KEYS = {
  SLASH: 191,
};

const BLOCK_MENUS = [
  { name: "table", desc: "Table" },
  { name: "H1", desc: "Big section heading" },
];

class BlockMenu {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.container = document.querySelector(options.container);
    this.quill.keyboard.addBinding(
      { key: KEYS.SLASH },
      this.onShowMenu.bind(this)
    );
    document.addEventListener("click", this.onDocumentClick.bind(this));
  }

  onShowMenu() {
    this.buildMenu();
    quill.insertText("/");
  }

  buildMenu() {
    let container = document.createElement("div");
    container.id = "quill-menu-module";
    container.className = "absolute shadow-lg border w-72 z-50 bg-white";
    let html = `
    <p class="text-gray-500 p-2 border-b border-b-gray-200 text-sm">
      BASICK BLOCKS
    </p>
    <ul>`;

    BLOCK_MENUS.forEach((item) => {
      html += `<li
        class="
          px-4
          py-2
          flex
          h-16
          border-b border-b-gray-200
          hover:bg-gray-200
          cursor-pointer
        "
        data-name="${item.name}"
      >
        <div class="flex">
          <div
            class="
              w-12
              h-12
              text-center
              leading-10
              border border-gray-200
              rounded-lg
              overflow-hidden
            "
          >
          ${item.name}
          </div>
        </div>
        <div class="flex pl-2 flex-col">
          <div class="text-black flex text-sm">${item.name}</div>
          <div class="text-gray-400 flex text-sm">${item.desc}</div>
        </div>
      </li>
      `;
    });

    html += `</ul>`;
    container.innerHTML = html;

    this.quill.root.parentElement.appendChild(container);

    this.repositionMenu(container);
    this.bindMenuEvens(container);
  }

  bindMenuEvens(menuEl) {
    menuEl.addEventListener("click", (e) => {
      let targetEl = e.target;
      while (targetEl) {
        if (targetEl && targetEl.matches("li")) {
          let name = targetEl.dataset.name;
          this.onClickMenu({ name });

          this.hideMenu();
        }
        targetEl = targetEl.parentElement;
      }
    });
  }
  onClickMenu(item) {
    let editor = this.quill;
    switch (item.name) {
      case "H1":
        editor.format("header", "h1");
        break;
      case "table":
        this.addNewTable();
        break;
      default:
        break;
    }
  }

  addNewTable() {
    quill.focus();
    quill.getModule("table").insertTable(2, 2);
  }

  repositionMenu(menuEl) {
    const bounds = this.quill.getBounds(this.quill.getSelection().index);
    menuEl.style.left = bounds.left + "px";
    menuEl.style.top = bounds.top + bounds.height + 10 + "px";
  }
  hideMenu() {
    this.isShowBlockMenus = false;
    document.getElementById("quill-menu-module")?.remove();
    // console.log('onHideMenu')
  }
  onDocumentClick() {
    this.hideMenu();
  }
}

//registar new moudles
Quill.register("modules/blockMenu", BlockMenu);

var quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    table: true,
    blockMenu: true,
  },
});
