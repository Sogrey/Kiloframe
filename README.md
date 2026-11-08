# Kiloframe

同一 1000 模型场景的 Three.js 性能对比演示：基线 / InstancedMesh / 几何合并 / LOD+剔除。

依据见 [`docs/可行性评估依据.md`](docs/可行性评估依据.md)。

## 开发

```bash
npm install
npm run dev
```

## 四种模式

| 模式 | 含义 |
|---|---|
| 基线 | 1000 个独立 `Mesh`（共享几何/材质，仍各一次 Draw Call） |
| InstancedMesh | 1 个 `InstancedMesh`，Draw Call N→1 |
| 几何合并 | `mergeGeometries` 合并为 1 个 Mesh |
| LOD + 剔除 | `THREE.LOD` + 视锥剔除 |

HUD 实时展示 `renderer.info`：FPS / Draw Calls / Triangles / Geometries。

## 模型

内置 Khronos 免费样本（无需自行下载）：`Duck` / `Avocado` / `DamagedHelmet` / `WaterBottle`，另加「程序方块」对照。界面可切换模型；自备 GLB 放到 `public/models/` 并在 `src/models/catalog.ts` 注册即可。
