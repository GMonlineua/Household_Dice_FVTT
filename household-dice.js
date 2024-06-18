class HouseholdDice {

  static async Init(controls, html) {
    const diceRollButton = $(`
      <li class="scene-control hhd-scene-control" data-control="household-dice" title="Household Dice Roller">
      <i class="fas fa-dice-d20"></i>
      </li>
    `);

    const diceRollControls = $(`
      <ol class="sub-controls app control-tools hhd-sub-controls">
      <li id="HHDpopup" class="household-dice-popup control-tool"></li>
      </ol>
    `);

    html.find(".main-controls").append(diceRollButton);
    html.append(diceRollControls);
    diceRollButton[0].addEventListener('click', ev => this.PopupSheet(ev, html));
    this._createDiceTable(html);
  }

  static _createDiceTableHtml() {
    let s = [];

    s.push('<ul>');
    for (let i = 2; i <= 9; ++i) {
      s.push('<li data-dice-roll="', i, '">', i, '</li>');
    }
    s.push('</ul>');

    return s.join('');
  }

  static async _createDiceTable(html) {
    const tableContentsHtml = this._createDiceTableHtml();
    const tableContents = $(tableContentsHtml);

    html.find('.household-dice-popup ul').remove();
    html.find('.household-dice-popup').append(tableContents);
    html.find('.household-dice-popup li').click(ev => this._rollDice(ev, html));
  }

  static async _rollDice(event, html) {
    const diceCount = event.target.dataset.diceRoll;
    let formula = diceCount + "d6"
    const roll = new Roll(formula);
    await roll.evaluate();

    let rollResult = {
      dice: roll.terms[0].results.map(result => result.result),
      basicSuccess: 0,
      criticalSuccess: 0,
      extremeSuccess: 0,
      impossibleSuccess: false,
      failure: false
    };

    // Count the occurrences of each dice value
    const diceCounts = rollResult.dice.reduce((counts, die) => {
        counts[die] = (counts[die] || 0) + 1;
        return counts;
    }, {});

    // Check for success based on the counts
    Object.values(diceCounts).forEach(count => {
        if (count === 2) {
            rollResult.basicSuccess++;
        } else if (count === 3) {
            rollResult.criticalSuccess++;
        } else if (count === 4) {
            rollResult.extremeSuccess++;
        } else if (count === 5) {
            rollResult.impossibleSuccess = true;
        }
    });

    // Check for failure
    if (
        rollResult.basicSuccess === 0 &&
        rollResult.criticalSuccess === 0 &&
        rollResult.extremeSuccess === 0 &&
        !rollResult.impossibleSuccess
    ) {
        rollResult.failure = true;
    }

    const chatMessage = await renderTemplate("modules/household-dice/templates/rollResult.hbs", rollResult);
    const chatData = {
      user: game.user._id,
      content: chatMessage,
      sound: CONFIG.sounds.dice
    };

    ChatMessage.create(chatData);

    this._close(event, html);
  }

  static async PopupSheet(event, html) {
    if (html.find('.hhd-scene-control').hasClass('active')) {
      this._close(event, html);
    } else {
      this._open(event, html);
  }
  }

  static async _close(event, html) {
    html.find('.hhd-scene-control').removeClass('active');
    html.find('.hhd-sub-controls').removeClass('active');
    html.find('.scene-control').first().addClass('active');

    event.stopPropagation();
  }

  static async _open(event, html) {
    this._createDiceTable(html);
    html.find('.scene-control').removeClass('active');
    html.find('.sub-controls').removeClass('active');
    html.find('.hhd-scene-control').addClass('active');
    html.find('.hhd-sub-controls').addClass('active');
    event.stopPropagation();
  }

}

Hooks.on('renderSceneControls', (controls, html) => {
  HouseholdDice.Init(controls, html);
});

Handlebars.registerHelper('getImageForValue', function(value) {
  const images = [
    '/modules/household-dice/assets/house.svg',
    '/modules/household-dice/assets/heart.svg',
    '/modules/household-dice/assets/diamond.svg',
    '/modules/household-dice/assets/club.svg',
    '/modules/household-dice/assets/spade.svg',
    '/modules/household-dice/assets/joker.svg'
  ];

  return images[value - 1];
});
