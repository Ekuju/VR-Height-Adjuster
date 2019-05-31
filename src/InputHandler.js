/**
 * Created by Trent on 5/31/2019.
 */

'use strict';

class InputHandler {
    static _onClickDesiredHeightIncrease() {
        InputHandler._desiredHeight += InputHandler.INTERVAL;

        InputHandler._processChange();
    }

    static _onChangeDesiredHeightInput(event) {
        InputHandler._desiredHeight = Number.parseFloat(event.target.value);

        InputHandler._processChange();
    }

    static _onClickDesiredHeightDecrease() {
        InputHandler._desiredHeight -= InputHandler.INTERVAL;

        InputHandler._processChange();
    }

    static _onClickRealHeightIncrease() {
        InputHandler._realHeight += InputHandler.INTERVAL;

        InputHandler._processChange();
    }

    static _onChangeRealHeightInput(event) {
        InputHandler._realHeight = Number.parseFloat(event.target.value);

        InputHandler._processChange();
    }

    static _onClickRealHeightDecrease() {
        InputHandler._realHeight -= InputHandler.INTERVAL;

        InputHandler._processChange();
    }

    static _onChangeEnabled(event) {
        InputHandler._enabled = event.target.checked || false;

        InputHandler._processChange();
    }

    static _processChange() {
        InputHandler._realHeightInput.value = Math.round(InputHandler._realHeight * 100) / 100;
        InputHandler._desiredHeightInput.value = Math.round(InputHandler._desiredHeight * 100) / 100;

        InputHandler._enabledCheckbox.checked = InputHandler._enabled;
        if (InputHandler._enabled && InputHandler._buttonContainer.classList.contains('disabled')) {
            InputHandler._buttonContainer.classList.remove('disabled');
        }
        if (!InputHandler._enabled && !InputHandler._buttonContainer.classList.contains('disabled')) {
            InputHandler._buttonContainer.classList.add('disabled');
        }
    }

    static getRealHeight() {
        return InputHandler._enabled ? InputHandler._realHeight / VRGraphics.FEET_PER_METER : 1;
    }

    static getDesiredHeight() {
        return InputHandler._enabled ? InputHandler._desiredHeight / VRGraphics.FEET_PER_METER : 1;
    }

    static initialize() {
        InputHandler._enabledCheckbox = document.getElementById('enabled-checkbox');
        InputHandler._buttonContainer = document.getElementById('button-container');
        InputHandler._realHeightDecreaseButton = document.getElementById('real-height-decrease');
        InputHandler._realHeightInput = document.getElementById('real-height-input');
        InputHandler._realHeightIncreaseButton = document.getElementById('real-height-increase');
        InputHandler._desiredHeightDecreaseButton = document.getElementById('desired-height-decrease');
        InputHandler._desiredHeightInput = document.getElementById('desired-height-input');
        InputHandler._desiredHeightIncreaseButton = document.getElementById('desired-height-increase');

        InputHandler._enabledCheckbox.onchange = InputHandler._onChangeEnabled;
        InputHandler._realHeightDecreaseButton.onclick = InputHandler._onClickRealHeightDecrease;
        InputHandler._realHeightInput.oninput = InputHandler._onChangeRealHeightInput;
        InputHandler._realHeightIncreaseButton.onclick = InputHandler._onClickRealHeightIncrease;
        InputHandler._desiredHeightDecreaseButton.onclick = InputHandler._onClickDesiredHeightDecrease;
        InputHandler._desiredHeightInput.oninput = InputHandler._onChangeDesiredHeightInput;
        InputHandler._desiredHeightIncreaseButton.onclick = InputHandler._onClickDesiredHeightIncrease;

        window.addEventListener('keydown', event => {
            switch (event.keyCode) {
                case InputHandler.KEY_LEFT: {
                    InputHandler._realHeight -= InputHandler.INTERVAL;
                    this._processChange();
                } break;

                case InputHandler.KEY_RIGHT: {
                    InputHandler._realHeight += InputHandler.INTERVAL;
                    this._processChange();
                } break;

                case InputHandler.KEY_DOWN: {
                    InputHandler._desiredHeight -= InputHandler.INTERVAL;
                    this._processChange();
                } break;

                case InputHandler.KEY_UP: {
                    InputHandler._desiredHeight += InputHandler.INTERVAL;
                    this._processChange();
                } break;
            }
        });

        InputHandler._processChange();
    }
}

InputHandler.KEY_LEFT = 37;
InputHandler.KEY_RIGHT = 39;
InputHandler.KEY_UP = 38;
InputHandler.KEY_DOWN = 40;

InputHandler.INTERVAL = 0.2;

InputHandler._enabledCheckbox = null;
InputHandler._buttonContainer = null;
InputHandler._realHeightDecreaseButton = null;
InputHandler._realHeightInput = null;
InputHandler._realHeightIncreaseButton = null;
InputHandler._desiredHeightDecreaseButton = null;
InputHandler._desiredHeightInput = null;
InputHandler._desiredHeightIncreaseButton = null;

InputHandler._enabled = true;
InputHandler._realHeight = 5.5;
InputHandler._desiredHeight = 5.5;