pragma solidity >= 0.5.4 <= 0.7.0;

contract Point {
    function mail() external  { }
}

contract Client {
    function onTimer() external { }
}

contract Clock {

    address client;
    uint timer;
    uint128 credit;
    Point point;
    bool active;

    modifier checkOwnerAndAccept {
        require(msg.pubkey() == tvm.pubkey(), 100);
		tvm.accept();
		_;
	}

    function setTimer(uint nSeconds) external {
        timer = now + nSeconds - 14;
        client = msg.sender;
        credit = uint128(msg.value - nSeconds * 5e5 - 2e8);
        uint128 rwd = uint128(nSeconds * 5e5 / 4);

        if (!active) {
            active = true;
            point.mail.value(rwd)();            
	    }
    }

    function mail() external {
        if (now > timer) {
            active = false;
            Client(client).onTimer.value(credit)();
        } else {
            point.mail();
        }
    }

    function setPoint(address addr) external checkOwnerAndAccept {
        point = Point(addr);
    }

    function sendTransaction(address dest, uint128 value, bool bounce) public view checkOwnerAndAccept {
        require(value > 0 && value < address(this).balance, 101);
        dest.transfer(value, bounce, 0);
    }

}

