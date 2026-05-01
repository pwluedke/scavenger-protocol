import Phaser from 'phaser';
import type { NodeDefinition } from '../logic/progression-data';

// Depth values: sit above all combat layer (400) and HUD graphics
const DEPTH_OVERLAY = 900;
const DEPTH_CARDS   = 1000;
const DEPTH_TEXT    = 1001;

const CARD_WIDTH  = 260;
const CARD_HEIGHT = 180;
const CARD_GAP    = 40;
const CARD_Y      = 360;

const CARD_COLOR_DEFAULT  = 0x1a2a3a;
const CARD_COLOR_SELECTED = 0x2a4a6a;
const CARD_BORDER_DEFAULT  = 0x336699;
const CARD_BORDER_SELECTED = 0x00ccff;

export interface OfferSceneData {
  offers: NodeDefinition[];
  salvageTier: number;
}

export class OfferScene extends Phaser.Scene {
  private offers: NodeDefinition[] = [];
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private borders: Phaser.GameObjects.Rectangle[] = [];
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private hintText!: Phaser.GameObjects.Text;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private altConfirmKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'OfferScene' });
  }

  init(data: OfferSceneData): void {
    this.offers = data.offers;
    this.selectedIndex = 0;
  }

  create(): void {
    if (this.offers.length === 0) {
      // No eligible nodes -- resume immediately without showing the screen
      this.closeWithResult(null);
      return;
    }

    // Dim overlay
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(DEPTH_OVERLAY);

    // Title
    this.add
      .text(640, 140, 'SALVAGE OFFER', { fontSize: '28px', fontFamily: 'monospace', color: '#00ccff' })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT);

    this.add
      .text(640, 180, 'Choose one upgrade for this run', { fontSize: '14px', fontFamily: 'monospace', color: '#888888' })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT);

    // Cards
    const totalWidth = this.offers.length * CARD_WIDTH + (this.offers.length - 1) * CARD_GAP;
    const startX = 640 - totalWidth / 2 + CARD_WIDTH / 2;

    this.cards = [];
    this.borders = [];
    this.nameTexts = [];

    for (let i = 0; i < this.offers.length; i++) {
      const x = startX + i * (CARD_WIDTH + CARD_GAP);
      const node = this.offers[i];

      const border = this.add.rectangle(x, CARD_Y, CARD_WIDTH + 4, CARD_HEIGHT + 4, CARD_BORDER_DEFAULT).setDepth(DEPTH_CARDS);
      const card = this.add.rectangle(x, CARD_Y, CARD_WIDTH, CARD_HEIGHT, CARD_COLOR_DEFAULT).setDepth(DEPTH_CARDS + 1);

      const poolLabel = node.pool.toUpperCase();
      this.add
        .text(x, CARD_Y - CARD_HEIGHT / 2 + 20, poolLabel, {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: this.poolColor(node.pool),
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_TEXT);

      const nameText = this.add
        .text(x, CARD_Y - 10, node.name, { fontSize: '18px', fontFamily: 'monospace', color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(DEPTH_TEXT);

      this.add
        .text(x, CARD_Y + 40, node.branch.toUpperCase(), {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#666666',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_TEXT);

      this.cards.push(card);
      this.borders.push(border);
      this.nameTexts.push(nameText);
    }

    this.hintText = this.add
      .text(640, 560, '[LEFT] / [RIGHT] to navigate   [SPACE] to confirm', {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#666666',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_TEXT);

    this.leftKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.confirmKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.altConfirmKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.refreshCards();
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.offers.length) % this.offers.length;
      this.refreshCards();
    }
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.offers.length;
      this.refreshCards();
    }
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.altConfirmKey)) {
      this.closeWithResult(this.offers[this.selectedIndex].id);
    }
  }

  private refreshCards(): void {
    for (let i = 0; i < this.cards.length; i++) {
      const selected = i === this.selectedIndex;
      this.cards[i].setFillStyle(selected ? CARD_COLOR_SELECTED : CARD_COLOR_DEFAULT);
      this.borders[i].setFillStyle(selected ? CARD_BORDER_SELECTED : CARD_BORDER_DEFAULT);
    }
  }

  private poolColor(pool: string): string {
    if (pool === 'rare') return '#ffcc44';
    if (pool === 'uncommon') return '#44ffaa';
    return '#aaaaaa';
  }

  private closeWithResult(pickedNodeId: string | null): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.emit('offerResult', pickedNodeId);
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
