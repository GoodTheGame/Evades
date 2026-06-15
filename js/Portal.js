// js/Portal.js
import CONFIG from './config.js';

export class Portal {
    constructor(x, y = 0, portalType = 'forward', options = {}) {
        this.x = x;
        this.y = y; // если высота не на весь мир
        this.width = options.width || CONFIG.PORTAL.WIDTH;
        this.height = options.height || null; // null = на всю высоту мира (будет задано при render)
        this.portalType = portalType; // 'forward', 'backward', 'dungeon', 'shop'...
        this.onEnter = options.onEnter || null; // функция, вызываемая при касании
        this.color = options.color || '#FFD700';
        this.glowIntensity = 0;
    }

    update() {
        this.glowIntensity = (this.glowIntensity + 0.05) % (Math.PI * 2);
    }

    render(ctx, worldHeight) {
        const h = this.height || worldHeight;
        const glow = Math.sin(this.glowIntensity) * 10;

        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(this.glowIntensity) * 0.2})`;
        ctx.fillRect(this.x - 5, this.y, this.width + 10, h);

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, h);

        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, h);

        // Стрелка или символ
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        let arrow = '►';
        if (this.portalType === 'backward') arrow = '◄';
        else if (this.portalType === 'dungeon') arrow = '▼';
        else if (this.portalType === 'shop') arrow = '$';
        // Можно задать своё
        ctx.fillText(arrow, this.x + this.width / 2 - 8, this.y + h / 2 + 7);
    }

    checkPlayerCollision(player) {
        const playerLeft = player.x - player.radius;
        const playerRight = player.x + player.radius;
        const h = this.height || Infinity; // если null — считаем, что по всей высоте
        const playerTop = player.y - player.radius;
        const playerBottom = player.y + player.radius;

        return (
            playerRight > this.x &&
            playerLeft < this.x + this.width &&
            playerBottom > this.y &&
            playerTop < this.y + h
        );
    }
}