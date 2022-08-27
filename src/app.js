import Quill from "quill";
import { positionElements, Placement } from "positioning";

const log = console.log.bind(console);

const KEYS = {
  SLASH: 191,
};

const BLOCK_MENUS = [
  { name: "table", desc: "Table" },
  { name: "H1", desc: "Big section heading" },
];

const QuillEvents = {
  EDITOR_CHANGE: "editor-change",
  SELECTION_CHANGE: "selection-change",
};

const DEFAULT_PLACEMENT = [
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right",
  "auto",
];

class BlockMenu {
  TOGGLE_TEMPLATE = `<svg width="9" height="9" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g><path d="M8,22c-4.411,0-8,3.589-8,8s3.589,8,8,8s8-3.589,8-8S12.411,22,8,22z"/><path d="M52,22c-4.411,0-8,3.589-8,8s3.589,8,8,8s8-3.589,8-8S56.411,22,52,22z"/><path d="M30,22c-4.411,0-8,3.589-8,8s3.589,8,8,8s8-3.589,8-8S34.411,22,30,22z"/></g></svg>`;

  DEFAULTS = {
    maxRowCount: -1,
  };

  constructor(quill, options) {
    this.quill = quill;
    this.options = { ...this.DEFAULTS, ...options };
    this.table = quill.getModule("table");
    this.container = document.querySelector(options.container);
    this.quill.keyboard.addBinding(
      { key: KEYS.SLASH },
      this.onShowMenu.bind(this)
    );
    document.addEventListener("click", this.onDocumentClick.bind(this));

    this.toggle = quill.addContainer("ql-table-toggle");
    this.toggle.classList.add("ql-table-toggle_hidden");
    this.toggle.innerHTML = this.TOGGLE_TEMPLATE;
    this.toggle.addEventListener("click", this.toggleClickHandler);
    this.quill.on(QuillEvents.EDITOR_CHANGE, this.editorChangeHandler);
    this.quill.root.addEventListener("contextmenu", this.contextMenuHandler);
  }

  menuItems = [
    {
      title: "Insert column right",
      handler: () => {
        if (
          !(this.options.maxRowCount > 0) ||
          this.getColCount() < this.options.maxRowCount
        ) {
          this.table.insertColumnRight();
        }
      },
    },
    {
      title: "Insert column left",

      handler: () => {
        if (
          !(this.options.maxRowCount > 0) ||
          this.getColCount() < this.options.maxRowCount
        ) {
          this.table.insertColumnLeft();
        }
      },
    },
    {
      title: "Insert row above",
      handler: () => {
        this.table.insertRowAbove();
      },
    },
    {
      title: "Insert row below",
      handler: () => {
        this.table.insertRowBelow();
      },
    },
    {
      title: "Delete column",
      handler: () => {
        this.table.deleteColumn();
      },
    },
    {
      title: "Delete row",
      handler: () => {
        this.table.deleteRow();
      },
    },
    {
      title: "Delete table",
      handler: () => {
        this.table.deleteTable();
      },
    },
  ];

  editorChangeHandler = (type, range, oldRange, source) => {
    if (type === QuillEvents.SELECTION_CHANGE) {
      this.detectButton(range);
    }
  };

  detectButton(range) {
    if (range == null) {
      return;
    }

    const show = this.isTable(range);
    if (show) {
      const [cell, offset] = this.quill.getLine(range.index);
      const containerBounds = this.quill.container.getBoundingClientRect();
      let bounds = cell.domNode.getBoundingClientRect();
      bounds = {
        bottom: bounds.bottom - containerBounds.top,
        height: bounds.height,
        left: bounds.left - containerBounds.left,
        right: bounds.right - containerBounds.left,
        top: bounds.top - containerBounds.top,
        width: bounds.width,
      };

      this.showToggle(bounds);
    } else {
      this.hideToggle();
      this.hideMenu();
    }
  }

  isTable(range) {
    if (!range) {
      range = this.quill.getSelection();
    }
    if (!range) {
      return false;
    }
    const formats = this.quill.getFormat(range.index);

    return !!(formats["table"] && !range.length);
  }

  createMenuItem(item) {
    const node = document.createElement("div");
    node.classList.add("ql-table-menu__item");

    const iconSpan = document.createElement("span");
    iconSpan.classList.add("ql-table-menu__item-icon");
    iconSpan.innerHTML = item.icon;

    const textSpan = document.createElement("span");
    textSpan.classList.add("ql-table-menu__item-text");
    textSpan.innerText = item.title;

    node.appendChild(textSpan);
    node.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.quill.focus();
        item.handler();
        this.hideMenu();
        this.detectButton(this.quill.getSelection());
      },
      false
    );
    return node;
  }

  showToggle(position) {
    this.position = position;
    this.toggle.classList.remove("ql-table-toggle_hidden");
    this.toggle.style.top = `${position.top}px`;
    this.toggle.style.left = `${position.left}px`;
  }

  toggleClickHandler = (e) => {
    this.toggleMenu();

    e.preventDefault();
    e.stopPropagation();
  };

  toggleMenu() {
    if (this.menu) {
      this.hideToggle();
    } else {
      this.showMenu();
    }
  }

  hideToggle() {
    this.toggle.classList.add("ql-table-toggle_hidden");
  }

  showMenu() {
    this.hideMenu();
    this.menu = this.quill.addContainer("ql-table-menu");

    this.menuItems.forEach((it) => {
      this.menu.appendChild(this.createMenuItem(it));
    });
    positionElements(this.toggle, this.menu, DEFAULT_PLACEMENT, false);
    document.addEventListener("click", this.docClickHandler);
  }

  hideMenu() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
      document.removeEventListener("click", this.docClickHandler);
    }
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

          this.hideSlashMenu();
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
    this.table.insertTable(3, 4);
  }

  repositionMenu(menuEl) {
    const bounds = this.quill.getBounds(this.quill.getSelection().index);
    menuEl.style.left = bounds.left + "px";
    menuEl.style.top = bounds.top + bounds.height + 10 + "px";
  }

  hideSlashMenu() {
    this.isShowBlockMenus = false;
    document.getElementById("quill-menu-module")?.remove();
  }
  onDocumentClick() {
    this.hideSlashMenu();
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
