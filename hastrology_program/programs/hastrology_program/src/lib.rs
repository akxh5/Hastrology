#![allow(unexpected_cfgs, deprecated)]
use anchor_lang::prelude::*;

declare_id!("2no8nWzYpbMyCo7gkVbJKFvxkGW84MhPKD96THuEbAoD");

pub mod state;
pub mod instructions;
pub mod errors;
pub  mod constants;

pub use instructions::*;

#[program]
pub mod hastrology_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        platform_wallet_pubkey: Pubkey,
        ticket_price: u64,
        platform_fee_bps: u16,
        first_lottery_endtime: i64,
    ) -> Result<()> {
        
        ctx.accounts.initialize_handle(
            platform_wallet_pubkey,
            ticket_price, 
            platform_fee_bps, 
            first_lottery_endtime, 
            &ctx.bumps
        )
    }

    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        
        ctx.accounts.reset_handle()
    }

    pub fn enter_lottery(ctx: Context<EnterLottery>) -> Result<()> {

        ctx.accounts.enter_lottery_handler()
    }

    pub fn request_draw(ctx: Context<RequestDraw>) -> Result<()> {

        ctx.accounts.request_draw_handler()
    }

    pub fn resolve_draw(ctx: Context<ResolveDraw>, randomness: [u8; 32]) -> Result<()> {

        ctx.accounts.resolve_draw_handler(randomness)
    }

    pub fn payout(ctx: Context<Payout>) -> Result<()> {

        ctx.accounts.payout_handler()
    }
}