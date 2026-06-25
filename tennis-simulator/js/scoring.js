// Tennis scoring: points → games → sets
export class TennisScore {
  constructor() {
    this._pts  = [0, 0]; // raw point counters [player, cpu]
    this.games = [0, 0];
    this.sets  = [0, 0];
    this._deuce = false;
    this._adv   = -1;    // -1=none, 0=player, 1=cpu
    this.gameOver = false;
    this.winner   = -1;
  }

  static LABELS = ['0', '15', '30', '40'];

  pointTo(side) { // side: 0=player, 1=cpu
    if (this.gameOver) return;

    if (this._deuce) {
      if (this._adv === -1) {
        this._adv = side;              // first advantage
      } else if (this._adv === side) {
        this._winGame(side);           // had advantage, wins game
      } else {
        this._adv = -1;               // back to deuce
      }
      return;
    }

    this._pts[side]++;

    const p = this._pts[0], o = this._pts[1];
    if (p >= 3 && o >= 3) {
      this._deuce = true;
      return;
    }
    if (this._pts[side] >= 4) {
      this._winGame(side);
    }
  }

  _winGame(side) {
    this._pts  = [0, 0];
    this._deuce = false;
    this._adv   = -1;
    this.games[side]++;

    const g = this.games[0], og = this.games[1];
    const wonSet = (side === 0)
      ? (g >= 6 && g - og >= 2) || g === 7
      : (og >= 6 && og - g >= 2) || og === 7;

    if (wonSet) {
      this.sets[side]++;
      this.games = [0, 0];
      if (this.sets[side] >= 2) {
        this.gameOver = true;
        this.winner   = side;
      }
    }
  }

  getDisplay() {
    let pointStr;
    if (this._deuce && this._adv === 0) pointStr = { p: 'ADV', c: '—' };
    else if (this._deuce && this._adv === 1) pointStr = { p: '—', c: 'ADV' };
    else if (this._deuce)                    pointStr = { p: 'DUC', c: 'DUC' };
    else pointStr = {
      p: TennisScore.LABELS[this._pts[0]] ?? '0',
      c: TennisScore.LABELS[this._pts[1]] ?? '0',
    };

    return {
      points:  pointStr,
      games:   { p: this.games[0], c: this.games[1] },
      sets:    { p: this.sets[0],  c: this.sets[1]  },
      gameOver: this.gameOver,
      winner:   this.winner,
    };
  }

  reset() {
    this._pts   = [0, 0];
    this.games  = [0, 0];
    this.sets   = [0, 0];
    this._deuce = false;
    this._adv   = -1;
    this.gameOver = false;
    this.winner   = -1;
  }
}
