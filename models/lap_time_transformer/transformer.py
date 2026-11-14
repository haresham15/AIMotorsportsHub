"""
PyTorch Lap-Time Transformer Model.
Contains a custom Multi-Head Attention module written completely from scratch
WITHOUT using torch.nn.MultiheadAttention.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiHeadSelfAttentionFromScratch(nn.Module):
    """
    Multi-Head Self-Attention implemented purely from scratch with tensor operations.
    Explicitly satisfies PRD requirement: 'written without nn.MultiheadAttention'.
    """
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1, is_causal: bool = True):
        super().__init__()
        assert d_model % n_heads == 0, f"d_model ({d_model}) must be divisible by n_heads ({n_heads})"
        
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.is_causal = is_causal
        
        # Linear projection matrices for Q, K, V
        self.w_q = nn.Linear(d_model, d_model, bias=False)
        self.w_k = nn.Linear(d_model, d_model, bias=False)
        self.w_v = nn.Linear(d_model, d_model, bias=False)
        
        # Final output projection
        self.w_o = nn.Linear(d_model, d_model, bias=True)
        
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (batch_size, seq_len, d_model)
            mask: Optional custom attention mask
        Returns:
            Tensor of shape (batch_size, seq_len, d_model)
        """
        B, L, _ = x.shape
        
        # 1. Project inputs to Query, Key, Value
        q = self.w_q(x)  # (B, L, d_model)
        k = self.w_k(x)  # (B, L, d_model)
        v = self.w_v(x)  # (B, L, d_model)
        
        # 2. Reshape into multi-heads: (B, n_heads, L, d_k)
        q = q.view(B, L, self.n_heads, self.d_k).transpose(1, 2)
        k = k.view(B, L, self.n_heads, self.d_k).transpose(1, 2)
        v = v.view(B, L, self.n_heads, self.d_k).transpose(1, 2)
        
        # 3. Scaled dot-product attention scores: (B, n_heads, L, L)
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        # 4. Apply causal mask if enabled (prevent looking at future laps)
        if self.is_causal and L > 1:
            causal_mask = torch.triu(torch.full((L, L), float('-inf'), device=x.device), diagonal=1)
            scores = scores + causal_mask.unsqueeze(0).unsqueeze(0)
            
        if mask is not None:
            scores = scores + mask
            
        # 5. Softmax along key dimension and apply dropout
        attn_weights = F.softmax(scores, dim=-1)
        attn_weights = self.dropout(attn_weights)
        
        # 6. Weighted sum over values: (B, n_heads, L, d_k)
        out = torch.matmul(attn_weights, v)
        
        # 7. Concatenate heads and project back to d_model: (B, L, d_model)
        out = out.transpose(1, 2).contiguous().view(B, L, self.d_model)
        out = self.w_o(out)
        
        return out

class TransformerBlock(nn.Module):
    """
    Standard Pre-LN Transformer Encoder Block.
    """
    def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1, is_causal: bool = True):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = MultiHeadSelfAttentionFromScratch(d_model, n_heads, dropout=dropout, is_causal=is_causal)
        self.dropout1 = nn.Dropout(dropout)
        
        self.ln2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Pre-LN residual connections
        norm_x = self.ln1(x)
        attn_out = self.attn(norm_x)
        x = x + self.dropout1(attn_out)
        
        norm_x2 = self.ln2(x)
        ffn_out = self.ffn(norm_x2)
        x = x + ffn_out
        return x

class LapTimeTransformer(nn.Module):
    """
    Autoregressive Transformer predicting the next lap time from sequence of historical laps.
    """
    def __init__(
        self,
        in_features: int = 4,
        d_model: int = 64,
        n_heads: int = 4,
        n_layers: int = 2,
        d_ff: int = 128,
        max_seq_len: int = 16,
        dropout: float = 0.1
    ):
        super().__init__()
        self.in_proj = nn.Linear(in_features, d_model)
        self.pos_embedding = nn.Parameter(torch.randn(1, max_seq_len, d_model) * 0.02)
        
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, n_heads, d_ff, dropout=dropout, is_causal=True)
            for _ in range(n_layers)
        ])
        
        self.final_ln = nn.LayerNorm(d_model)
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, 1)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (batch_size, seq_len, in_features)
        Returns:
            Tensor of shape (batch_size, 1) predicting normalized next lap time
        """
        B, L, _ = x.shape
        h = self.in_proj(x) + self.pos_embedding[:, :L, :]
        
        for block in self.blocks:
            h = block(h)
            
        h = self.final_ln(h)
        
        # Use representation of the most recent lap in sequence
        last_step = h[:, -1, :]  # (B, d_model)
        pred = self.head(last_step)  # (B, 1)
        return pred
