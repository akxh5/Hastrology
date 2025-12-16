use anchor_lang::prelude::*;
use crate::{constants::LOTTERY_STATE_SEED, errors::HashtrologyErrors, state::LotteryState};
use ephemeral_vrf_sdk::{rnd::random_u64, consts::VRF_PROGRAM_IDENTITY};

#[derive(Accounts)]
pub struct ResolveDraw<'info> {
    #[account(address = VRF_PROGRAM_IDENTITY)]
    pub vrf_program: Signer<'info>,

    #[account(
        mut,
        seeds = [LOTTERY_STATE_SEED],
        bump
    )]
    pub lottery_state: Account<'info, LotteryState>,

}

impl<'info> ResolveDraw<'info> {
    pub fn resolve_draw_handler(&mut self, randomness: [u8; 32]) -> Result<()> {  
        let lottery_state = &mut self.lottery_state;
        let total_participants = lottery_state.total_participants;

        let raw_random_value = random_u64(&randomness);

        if total_participants == 0 {
            msg!("No participants. No winner selected.");
            lottery_state.winner = 0;
        } else {
            let winning_index = raw_random_value % total_participants;
            lottery_state.winner = winning_index.checked_add(1).ok_or(HashtrologyErrors::Overflow)?;
            msg!(
                "Lottery Resolved! Raw: {}, Participants: {}, Winner Index: {}", 
                raw_random_value,
                lottery_state.total_participants,
                winning_index
            );
        }
        
        Ok(())
    }
}