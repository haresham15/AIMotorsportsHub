import unittest
import torch
from models.lap_time_transformer.transformer import (
    MultiHeadSelfAttentionFromScratch,
    TransformerBlock,
    LapTimeTransformer
)

class TestTransformer(unittest.TestCase):
    def test_multihead_attention_shape(self):
        B, L, d_model, n_heads = 4, 5, 32, 4
        mha = MultiHeadSelfAttentionFromScratch(d_model=d_model, n_heads=n_heads, is_causal=True)
        x = torch.randn(B, L, d_model)
        out = mha(x)
        self.assertEqual(out.shape, (B, L, d_model))

    def test_transformer_block(self):
        B, L, d_model = 2, 6, 64
        block = TransformerBlock(d_model=d_model, n_heads=4, d_ff=128)
        x = torch.randn(B, L, d_model)
        out = block(x)
        self.assertEqual(out.shape, (B, L, d_model))

    def test_lap_time_transformer_forward_and_backward(self):
        B, L, in_features = 8, 5, 4
        model = LapTimeTransformer(in_features=in_features, d_model=32, n_heads=4, n_layers=2)
        x = torch.randn(B, L, in_features)
        target = torch.randn(B, 1)
        
        pred = model(x)
        self.assertEqual(pred.shape, (B, 1))
        
        loss = torch.nn.functional.mse_loss(pred, target)
        loss.backward()
        
        # Verify gradients populated and not NaN
        for name, param in model.named_parameters():
            if param.requires_grad:
                self.assertIsNotNone(param.grad, f"Grad is None for {name}")
                self.assertFalse(torch.isnan(param.grad).any(), f"Grad has NaN for {name}")

    def test_causal_masking_independence(self):
        """Verify modifying a future lap does not affect prediction at an earlier step."""
        mha = MultiHeadSelfAttentionFromScratch(d_model=16, n_heads=2, is_causal=True)
        mha.eval()
        
        x1 = torch.randn(1, 4, 16)
        x2 = x1.clone()
        # Alter the last token (index 3)
        x2[:, 3, :] = torch.randn(1, 16)
        
        with torch.no_grad():
            out1 = mha(x1)
            out2 = mha(x2)
            
        # Due to causal masking, output at step 0, 1, 2 must be identical!
        diff_early = torch.max(torch.abs(out1[:, :3, :] - out2[:, :3, :])).item()
        self.assertLess(diff_early, 1e-5)

if __name__ == '__main__':
    unittest.main()
