import CONFIG from './config.js';

export class MiniMap {
    constructor() {
        this.width = CONFIG.MINIMAP.WIDTH;
        this.height = CONFIG.MINIMAP.HEIGHT;
        this.scaleX = this.width / CONFIG.WORLD.WIDTH;
        this.scaleY = this.height / CONFIG.WORLD.HEIGHT;
        this.x = 10;
        this.y = 10;
    }

    render(ctx, camera, player, enemies, portals) {
        const { width, height, scaleX, scaleY, x, y } = this;
        
        ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(x, y + 2, (CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH) * scaleX, height - 4);
        ctx.fillRect(
            x + (CONFIG.WORLD.WIDTH - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH) * scaleX, 
            y + 2, 
            (CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH) * scaleX, 
            height - 4
        );
        
        ctx.fillStyle = '#FFD700';
        if (portals.forward) {
            ctx.fillRect(x + portals.forward.x * scaleX, y + 2, CONFIG.PORTAL.WIDTH * scaleX, height - 4);
        }
        if (portals.backward) {
            ctx.fillRect(x + portals.backward.x * scaleX, y + 2, CONFIG.PORTAL.WIDTH * scaleX, height - 4);
        }
        
        ctx.fillStyle = '#888';
        for (let enemy of enemies) {
            ctx.beginPath();
            ctx.arc(x + enemy.x * scaleX, y + enemy.y * scaleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#00d9ff';
        ctx.beginPath();
        ctx.arc(x + player.x * scaleX, y + player.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            x + camera.x * scaleX,
            y + camera.y * scaleY,
            camera.width * scaleX,
            camera.height * scaleY
        );
    }
}