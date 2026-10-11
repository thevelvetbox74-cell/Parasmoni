/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Global Chat Trigger Utility
 */

export function openParasmoniChat(): void {
  window.dispatchEvent(new Event('open-parasmoni-chat'));
}
