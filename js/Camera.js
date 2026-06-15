export class Camera {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.smoothness = 0.2;
    }

    update(player, worldWidth, worldHeight) {
        this.targetX = player.x - this.width / 2;
        this.targetY = player.y - this.height / 2;

        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    reset(ctx) {
        ctx.restore();
    }

    worldToScreen(worldX, worldY) {
        return { x: worldX - this.x, y: worldY - this.y };
    }

    screenToWorld(screenX, screenY) {
        return { x: screenX + this.x, y: screenY + this.y };
    }
}
