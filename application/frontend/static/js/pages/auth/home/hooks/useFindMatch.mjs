import { Component } from "../../../../components/component.mjs";
import { RequestFailedError } from "../../../../services/errors.mjs";
import { MatchService } from "../../../../services/match.mjs";

/**
 * @param {Component} page
 */
export function useFindMatch(page) {
  const t_button_find_match = page.element.querySelector("#find-match-button");
  const t_errors_find_match = page.element.querySelector("#find-match-errors");

  t_button_find_match.addEventListener("click", async () => {
    t_errors_find_match.clearErrors();
    try {
      t_button_find_match.setLoading(true);
      await MatchService.findMatch();
    } catch (error) {
      if (error instanceof RequestFailedError) {
        t_errors_find_match.addErrors(error.data?.message);
        t_errors_find_match.addErrors(error.data?.error?._errors);
      }
    } finally {
      t_button_find_match.setLoading(false);
    }
  });
}
