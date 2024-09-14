import { Component } from "./components/component.mjs";

/** @type {import("./router/router.mjs").Page} */
export const HomePage = ({ params }) => {
    const page = new Component("div").class("container mx-auto");
    page.element.innerHTML = 
        `<t-navbar></t-navbar>
        <div class="top-image mt-3">
            <img src="/media/default/front/banner.jpg" alt="Banner" class="rounded rounded-5 w-50">
        </div>`;
    return page;
}



