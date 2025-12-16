use anchor_lang::prelude::*;

use crate::{instruction, ID};
use crate::{constants::LOTTERY_STATE_SEED, errors::HashtrologyErrors, state::LotteryState};

use ephemeral_vrf_sdk::anchor::vrf;
use ephemeral_vrf_sdk::consts::DEFAULT_QUEUE;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;

#[vrf]
#[derive(Accounts)]
pub struct RequestDraw<'info> {
    #[account(
        mut,
        constraint = authority.key() == lottery_state.authority @ HashtrologyErrors::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [LOTTERY_STATE_SEED],
        bump = lottery_state.lottery_state_bump
    )]
    pub lottery_state: Account<'info, LotteryState>,
    /// CHECK: MagicBlock default queue
    #[account(
        mut,
        address = DEFAULT_QUEUE @ HashtrologyErrors::Overflow
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

impl<'info> RequestDraw<'info> {
    pub fn request_draw_handler(&mut self) -> Result<()> {  
        
        let clock = Clock::get()?;
        
        let lottery_state = &mut self.lottery_state;
        
        require!(clock.unix_timestamp >= lottery_state.lottery_endtime, HashtrologyErrors::LotteryNotOver);
        lottery_state.is_drawing = true;

        msg!("Randomness requested for Lottery #{} and {}", lottery_state.current_lottery_id, lottery_state.is_drawing);

        let accounts_metas = vec![
            SerializableAccountMeta {
                pubkey: lottery_state.key(),
                is_signer: false,
                is_writable: true,
            },
        ];

        let ix = create_request_randomness_ix( RequestRandomnessParams {
            payer: self.authority.key(),
            oracle_queue:  self.oracle_queue.key(),
            callback_program_id: ID,
            callback_discriminator: instruction::ResolveDraw::DISCRIMINATOR.to_vec(),
            accounts_metas: Some(accounts_metas),
            ..Default::default()
        });

        self.invoke_signed_vrf(&self.authority.to_account_info(), &ix)?;

        Ok(())
        
    }
}